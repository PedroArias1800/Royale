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
_PANAMA_TZ    = timezone(timedelta(hours=-5))

_DELIVERY_CONFIG_ID  = "delivery_config"
_DEF_DELIVERY_FEE    = 5.0
_DEF_DELIVERY_MIN    = 8.0


def _get_delivery_cfg(db) -> dict:
    cfg = db.config.find_one({"_id": _DELIVERY_CONFIG_ID})
    if not cfg:
        return {"fee_per_order": _DEF_DELIVERY_FEE, "min_daily_fee": _DEF_DELIVERY_MIN}
    return {
        "fee_per_order": float(cfg.get("fee_per_order", _DEF_DELIVERY_FEE)),
        "min_daily_fee": float(cfg.get("min_daily_fee", _DEF_DELIVERY_MIN)),
    }


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

    # ── Auto-gasto de delivery al marcar como entregado ──────────────────────
    if body.delivery_status == "delivered":
        assigned_id   = existing.get("delivery_assigned_to")
        assigned_name = existing.get("delivery_assigned_name", "")

        if assigned_id:
            try:
                assigned_oid  = ObjectId(str(assigned_id))
                assigned_str  = str(assigned_oid)

                # Inicio y fin del día UTC actual
                day_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
                day_end   = now.replace(hour=23, minute=59, second=59, microsecond=999999)

                # Transacciones del mismo repartidor ya entregadas hoy (excluye la actual)
                # El campo puede estar guardado como string u ObjectId — consultamos ambas formas
                delivered_today = list(db.transactions.find(
                    {
                        "_id":                 {"$ne": oid},
                        "delivery_assigned_to": {"$in": [assigned_oid, assigned_str]},
                        "delivery_status":     "delivered",
                        "delivered_at":        {"$gte": day_start, "$lte": day_end},
                    },
                    {"_id": 1, "operational_costs": 1},
                ))

                cfg           = _get_delivery_cfg(db)
                fee_per_order = cfg["fee_per_order"]
                min_daily_fee = cfg["min_daily_fee"]

                count = len(delivered_today)
                if count == 0:
                    amount = min_daily_fee          # Primera entrega del día
                elif count == 1:
                    amount = fee_per_order          # Segunda entrega → ajusta la primera retroactivamente
                    # Actualizar el primer ítem de delivery de la primera transacción del día
                    first_tx = delivered_today[0]
                    new_costs = []
                    for item in (first_tx.get("operational_costs") or []):
                        if (item.get("type_key") == "delivery"
                                and str(item.get("responsible_id", "")) == assigned_str):
                            item = {**item, "amount": fee_per_order}
                        new_costs.append(item)
                    db.transactions.update_one(
                        {"_id": first_tx["_id"]},
                        {"$set": {"operational_costs": new_costs, "updatedAt": now}},
                    )
                else:
                    amount = fee_per_order          # Tercera entrega en adelante

                # Verificar si ya existe un ítem delivery para este usuario en esta transacción
                current_costs = db.transactions.find_one(
                    {"_id": oid}, {"operational_costs": 1}
                ).get("operational_costs") or []

                new_item = {
                    "amount":           amount,
                    "type_key":         "delivery",
                    "type_label":       "Entrega del Producto",
                    "responsible_id":   assigned_str,
                    "responsible_name": assigned_name,
                }

                # Reemplazar ítem existente de delivery o agregar uno nuevo
                has_delivery = any(
                    i.get("type_key") == "delivery"
                    and str(i.get("responsible_id", "")) == assigned_str
                    for i in current_costs
                )
                if has_delivery:
                    updated_costs = [
                        ({**i, "amount": amount} if (
                            i.get("type_key") == "delivery"
                            and str(i.get("responsible_id", "")) == assigned_str
                        ) else i)
                        for i in current_costs
                    ]
                else:
                    updated_costs = current_costs + [new_item]

                db.transactions.update_one(
                    {"_id": oid},
                    {"$set": {"operational_costs": updated_costs, "updatedAt": now}},
                )
            except Exception:
                pass  # No bloquear el cambio de estado si falla el cálculo

    return {"success": True}
