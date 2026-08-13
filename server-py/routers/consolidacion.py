from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
from bson import ObjectId

from database import get_db
from auth import verify_token
from helpers import serialize_doc, to_object_id

router = APIRouter()

_STATUS_ORDER = {"pending": 0, "delivered": 1, "cancelled": 2}
_PANAMA_TZ = timezone(timedelta(hours=-5))


def _panama_date(dt) -> str:
    """Convierte un datetime UTC a fecha YYYY-MM-DD en zona horaria Panamá (UTC-5)."""
    if dt is None:
        return ""
    try:
        if isinstance(dt, str):
            dt = datetime.fromisoformat(dt.replace("Z", "+00:00"))
        return dt.astimezone(_PANAMA_TZ).strftime("%Y-%m-%d")
    except Exception:
        return ""


def _brief_transaction(doc: dict, db) -> dict:
    s = serialize_doc(doc)
    if not s:
        return s

    # Resolve product display names
    if doc.get("products"):
        raw_ids = [p for p in doc["products"] if "=" not in p]
        parfums_map = {}
        versions_map = {}

        if raw_ids:
            lookup_ids = []
            for p in raw_ids:
                try:
                    lookup_ids.append(ObjectId(p))
                except Exception:
                    pass
            if lookup_ids:
                parfums_cursor = list(db.parfums.find({"_id": {"$in": lookup_ids}}, {"title": 1, "version_id_fk": 1}))
                parfums_map = {str(p["_id"]): p for p in parfums_cursor}
                version_ids = [p.get("version_id_fk") for p in parfums_cursor if p.get("version_id_fk")]
                if version_ids:
                    versions_map = {
                        str(v["_id"]): v.get("version_name", "")
                        for v in db.versions.find({"_id": {"$in": version_ids}}, {"version_name": 1})
                    }

        resolved = []
        for p in doc["products"]:
            if "=" in p:
                resolved.append(p.split("=")[1])
            else:
                parfum_doc = parfums_map.get(p, {})
                title = parfum_doc.get("title", p)
                version_id = str(parfum_doc.get("version_id_fk", ""))
                version_name = versions_map.get(version_id, "")
                resolved.append(f"{title} - {version_name}" if version_name else title)
        s["products_resolved"] = resolved

    # Resolve ml values from productsTypes → db.types
    if doc.get("productsTypes"):
        type_ids = []
        for t in doc["productsTypes"]:
            try:
                type_ids.append(ObjectId(str(t)))
            except Exception:
                pass
        if type_ids:
            try:
                types_map = {
                    str(t["_id"]): t.get("ml", "")
                    for t in db.types.find({"_id": {"$in": type_ids}}, {"ml": 1})
                }
                s["types_resolved"] = [
                    str(types_map.get(str(t), "") or "")
                    for t in doc["productsTypes"]
                ]
            except Exception:
                pass

    return s


@router.get("/api/consolidacion")
def get_consolidacion(
    date: str = Query(None),
    date_from: str = Query(None),
    date_to: str = Query(None),
    token: dict = Depends(verify_token),
):
    db = get_db()
    user_id = str(token["id"])

    user_doc = db.users.find_one({"_id": to_object_id(user_id)}, {"rol": 1, "roles": 1})
    if user_doc:
        user_roles = user_doc.get("roles") or [user_doc.get("rol", 2)]
        is_admin = 1 in user_roles
    else:
        is_admin = False

    # Solo transacciones con pago confirmado (status=2 = procesadas/en camino)
    all_docs = list(db.transactions.find({"status": 2}).sort("createdAt", -1))

    # ── MODO RANGO: admin solicita historial entre 2 fechas ──────────────────
    if is_admin and date_from and date_to:
        def _in_range(d) -> bool:
            if not (d.get("delivery_assigned_to") and str(d.get("delivery_assigned_to")).strip()):
                return False
            if d.get("delivery_date"):
                return date_from <= d["delivery_date"] <= date_to
            # Sin delivery_date: usar createdAt como referencia
            created = d.get("createdAt")
            if created:
                return date_from <= _panama_date(created) <= date_to
            return False

        docs = [d for d in all_docs if _in_range(d)]
        docs.sort(key=lambda d: (
            d.get("delivery_date") or _panama_date(d.get("createdAt")),
            _STATUS_ORDER.get(d.get("delivery_status") or "pending", 0)
        ))
        return {"date": f"{date_from}/{date_to}", "orders": [_brief_transaction(d, db) for d in docs]}

    # ── MODO FECHA ÚNICA (default) ───────────────────────────────────────────
    if not date:
        panama_now = datetime.now(_PANAMA_TZ)
        date = panama_now.strftime("%Y-%m-%d")

    today = datetime.now(_PANAMA_TZ).strftime("%Y-%m-%d")
    is_today = (date == today)

    if is_admin:
        # Admin: pedidos asignados cuya delivery_date == date
        # Cuando se consulta HOY, además incluye pendientes sin fecha (sin asignar)
        docs = [
            d for d in all_docs
            if d.get("delivery_assigned_to") and str(d.get("delivery_assigned_to")).strip()
            and (
                d.get("delivery_date") == date
                or (
                    is_today
                    and not d.get("delivery_date")
                    and d.get("delivery_status") not in ("delivered", "cancelled")
                )
            )
        ]
    else:
        # Delivery: pedidos propios cuya delivery_date == date
        # o completados/cancelados ese día; al consultar HOY también ve pendientes sin fecha
        docs = [
            d for d in all_docs
            if str(d.get("delivery_assigned_to", "")) == user_id
            and (
                d.get("delivery_date") == date
                or _panama_date(d.get("delivered_at")) == date
                or (
                    is_today
                    and not d.get("delivery_date")
                    and d.get("delivery_status") not in ("delivered", "cancelled")
                )
            )
        ]

    docs.sort(key=lambda d: _STATUS_ORDER.get(d.get("delivery_status") or "pending", 0))
    return {"date": date, "orders": [_brief_transaction(d, db) for d in docs]}


class DeliveryStatusBody(BaseModel):
    delivery_status: str
    delivered_by: Optional[str] = None
    delivery_note: Optional[str] = None


@router.put("/api/consolidacion/{tx_id}/delivery")
def update_delivery_status(tx_id: str, body: DeliveryStatusBody, token: dict = Depends(verify_token)):
    db = get_db()
    valid = {"pending", "delivered", "cancelled"}
    if body.delivery_status not in valid:
        return JSONResponse(status_code=400, content={"message": f"Estado inválido. Valores permitidos: {list(valid)}"})

    oid = to_object_id(tx_id)
    existing = db.transactions.find_one({"_id": oid})
    if not existing:
        return JSONResponse(status_code=404, content={"message": "Transacción no encontrada"})

    user_doc = db.users.find_one({"_id": to_object_id(str(token["id"]))}, {"rol": 1, "roles": 1})
    if user_doc:
        user_roles = user_doc.get("roles") or [user_doc.get("rol", 2)]
        caller_is_admin = 1 in user_roles
    else:
        caller_is_admin = False

    current_status = existing.get("delivery_status", "pending")
    if current_status in ("delivered", "cancelled") and not caller_is_admin:
        return JSONResponse(status_code=403, content={"message": "Solo un administrador puede cambiar el estado de un pedido ya procesado."})

    now = datetime.now(timezone.utc)
    updates = {"delivery_status": body.delivery_status, "updatedAt": now}

    if body.delivery_status in ("delivered", "cancelled"):
        updates["delivered_at"] = now
        if body.delivered_by:
            updates["delivered_by"] = body.delivered_by
        if body.delivery_note:
            updates["delivery_note"] = body.delivery_note

    result = db.transactions.update_one({"_id": oid}, {"$set": updates})
    if result.matched_count == 0:
        return JSONResponse(status_code=404, content={"message": "Transacción no encontrada"})
    return {"success": True}
