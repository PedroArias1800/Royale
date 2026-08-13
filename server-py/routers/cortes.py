from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from bson import ObjectId

from database import get_db
from auth import verify_token
from helpers import to_object_id, generate_order_number

router = APIRouter()

CONFIG_ID = "corte_split"
_DEF_ROYALE = 50.0
_DEF_SELLER = 50.0

DELIVERY_CONFIG_ID        = "delivery_config"
_DEF_DELIVERY_FEE         = 5.0
_DEF_DELIVERY_MIN         = 8.0

OP_COST_TYPES_ID          = "op_cost_types"
OP_COST_SERVICES_ID       = "op_cost_external_services"

_DEF_OP_COST_TYPES = [
    {"key": "payment_fee",    "label": "Cargo de Método de Pago", "responsible_mode": "external"},
    {"key": "product_search", "label": "Búsqueda del Producto",   "responsible_mode": "admin"},
    {"key": "delivery",       "label": "Entrega del Producto",    "responsible_mode": "admin_delivery"},
    {"key": "packaging",      "label": "Costo de Empaque",        "responsible_mode": "admin"},
]
_DEF_EXTERNAL_SERVICES = ["Yappy", "Wompi", "Otro"]


# ─── Helpers internos ────────────────────────────────────────────────────────

def _get_config(db) -> dict:
    cfg = db.config.find_one({"_id": CONFIG_ID})
    if not cfg:
        return {"royale_pct": _DEF_ROYALE, "seller_pct": _DEF_SELLER}
    return {"royale_pct": float(cfg["royale_pct"]), "seller_pct": float(cfg["seller_pct"])}


def _get_user(payload: dict, db):
    try:
        user = db.users.find_one({"_id": ObjectId(payload["id"])})
    except Exception:
        raise HTTPException(status_code=401, detail="Token inválido")
    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    return user


def _require_admin(payload: dict, db):
    user = _get_user(payload, db)
    if user.get("rol") != 1:
        raise HTTPException(status_code=403, detail="Solo los administradores pueden realizar esta acción")
    return user


def _parse_dt(s: str) -> datetime:
    dt = datetime.fromisoformat(s)
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def _seller_tx_match(start_dt: datetime, end_dt: datetime) -> dict:
    """Transacciones de ingreso procesadas con vendedor asignado, dentro del período."""
    return {
        "createdAt": {"$gte": start_dt, "$lte": end_dt},
        "status": 2,
        "omitted": {"$ne": True},
        "seller_id_fk": {"$exists": True, "$ne": None},
        "$or": [
            {"fin_type": {"$exists": False}},
            {"fin_type": None},
            {"fin_type": "ingreso"},
        ],
    }


def _sum_op_costs(tx: dict) -> float:
    """Suma operational_costs[] con fallback a operational_cost (campo legado)."""
    items = tx.get("operational_costs") or []
    if items:
        return sum(float(i.get("amount") or 0) for i in items)
    return float(tx.get("operational_cost") or 0)


def _get_delivery_config(db) -> dict:
    cfg = db.config.find_one({"_id": DELIVERY_CONFIG_ID})
    if not cfg:
        return {"fee_per_order": _DEF_DELIVERY_FEE, "min_daily_fee": _DEF_DELIVERY_MIN}
    return {
        "fee_per_order": float(cfg.get("fee_per_order", _DEF_DELIVERY_FEE)),
        "min_daily_fee": float(cfg.get("min_daily_fee", _DEF_DELIVERY_MIN)),
    }


def _get_op_cost_types(db) -> dict:
    types_doc    = db.config.find_one({"_id": OP_COST_TYPES_ID})
    services_doc = db.config.find_one({"_id": OP_COST_SERVICES_ID})
    return {
        "types":    types_doc["types"]    if types_doc    else _DEF_OP_COST_TYPES,
        "services": services_doc["services"] if services_doc else _DEF_EXTERNAL_SERVICES,
    }


def _tx_utility(tx: dict, cost_cache: dict, db) -> tuple[float, float]:
    """Devuelve (utilidad, cogs) de una transacción."""
    total = float(tx.get("total") or 0)
    pc = tx.get("products_cost")
    oc = _sum_op_costs(tx)

    if pc is not None:
        cogs = float(pc) + oc
    else:
        cogs = oc
        for pt, qty in zip(tx.get("productsTypes", []), tx.get("quantities", [])):
            try:
                key = str(pt)
                if key not in cost_cache:
                    t = db.types.find_one({"_id": ObjectId(key)}, {"cost": 1})
                    cost_cache[key] = float(t.get("cost") or 0) if t else 0.0
                cogs += cost_cache[key] * int(qty or 1)
            except Exception:
                pass

    return round(total - cogs, 4), round(cogs, 4)


def _build_preview(start_dt: datetime, end_dt: datetime, db, config: dict) -> list:
    """Calcula el breakdown por vendedor sin persistir."""
    txs = list(db.transactions.find(
        _seller_tx_match(start_dt, end_dt),
        {"seller_id_fk": 1, "total": 1, "products_cost": 1, "operational_cost": 1,
         "operational_costs": 1, "productsTypes": 1, "quantities": 1},
    ))

    cost_cache: dict = {}
    sellers_map: dict = {}

    for tx in txs:
        sid = str(tx["seller_id_fk"])
        utility, cogs = _tx_utility(tx, cost_cache, db)
        total = float(tx.get("total") or 0)

        if sid not in sellers_map:
            sellers_map[sid] = {"total_ingresos": 0.0, "total_cogs": 0.0,
                                "utilidad": 0.0, "tx_count": 0}
        sellers_map[sid]["total_ingresos"] += total
        sellers_map[sid]["total_cogs"] += cogs
        sellers_map[sid]["utilidad"] += utility
        sellers_map[sid]["tx_count"] += 1

    royale_pct = config["royale_pct"]
    seller_pct = config["seller_pct"]
    result = []

    for sid, data in sellers_map.items():
        try:
            u = db.users.find_one({"_id": ObjectId(sid)}, {"firstname": 1, "lastname": 1})
            name = f"{u['firstname']} {u['lastname']}" if u else "Desconocido"
        except Exception:
            name = "Desconocido"

        utilidad = round(data["utilidad"], 2)
        result.append({
            "seller_id":      sid,
            "seller_name":    name,
            "total_ingresos": round(data["total_ingresos"], 2),
            "total_cogs":     round(data["total_cogs"], 2),
            "utilidad":       utilidad,
            "seller_cut":     round(utilidad * seller_pct / 100, 2),
            "royale_cut":     round(utilidad * royale_pct / 100, 2),
            "tx_count":       data["tx_count"],
        })

    return sorted(result, key=lambda x: x["utilidad"], reverse=True)


def _serialize_corte(doc: dict) -> dict:
    sellers = []
    for s in doc.get("sellers", []):
        sellers.append({
            "seller_id":      str(s.get("seller_id", "")),
            "seller_name":    s.get("seller_name", ""),
            "total_ingresos": s.get("total_ingresos", 0),
            "total_cogs":     s.get("total_cogs", 0),
            "utilidad":       s.get("utilidad", 0),
            "seller_cut":     s.get("seller_cut", 0),
            "royale_cut":     s.get("royale_cut", 0),
            "tx_count":       s.get("tx_count", 0),
            "paid":           s.get("paid", False),
            "paid_at":        s["paid_at"].isoformat() if s.get("paid_at") else None,
            "transaction_id": str(s["transaction_id"]) if s.get("transaction_id") else None,
        })
    return {
        "_id":               str(doc["_id"]),
        "label":             doc.get("label", ""),
        "period_start":      doc["period_start"].isoformat() if doc.get("period_start") else None,
        "period_end":        doc["period_end"].isoformat() if doc.get("period_end") else None,
        "royale_pct":        doc.get("royale_pct", _DEF_ROYALE),
        "seller_pct":        doc.get("seller_pct", _DEF_SELLER),
        "sellers":           sellers,
        "total_ingresos":    doc.get("total_ingresos", 0),
        "total_cogs":        doc.get("total_cogs", 0),
        "total_utilidad":    doc.get("total_utilidad", 0),
        "total_seller_cuts": doc.get("total_seller_cuts", 0),
        "total_royale_cuts": doc.get("total_royale_cuts", 0),
        "createdAt":         doc["createdAt"].isoformat() if doc.get("createdAt") else None,
    }


# ─── Endpoints de configuración ───────────────────────────────────────────────

@router.get("/api/cortes/config")
def get_config(db=Depends(get_db), payload: dict = Depends(verify_token)):
    return _get_config(db)


class ConfigBody(BaseModel):
    royale_pct: float
    seller_pct: float


@router.put("/api/cortes/config")
def update_config(body: ConfigBody, db=Depends(get_db), payload: dict = Depends(verify_token)):
    _require_admin(payload, db)
    total = round(body.royale_pct + body.seller_pct, 4)
    if total != 100.0:
        raise HTTPException(status_code=400, detail=f"Los porcentajes deben sumar 100% (actualmente {total}%)")
    db.config.update_one(
        {"_id": CONFIG_ID},
        {"$set": {"royale_pct": body.royale_pct, "seller_pct": body.seller_pct,
                  "updatedAt": datetime.now(timezone.utc)}},
        upsert=True,
    )
    return {"royale_pct": body.royale_pct, "seller_pct": body.seller_pct}


# ─── Delivery config endpoints ───────────────────────────────────────────────

@router.get("/api/cortes/delivery-config")
def get_delivery_config(db=Depends(get_db), payload: dict = Depends(verify_token)):
    return _get_delivery_config(db)


class DeliveryConfigBody(BaseModel):
    fee_per_order: float
    min_daily_fee: float


@router.put("/api/cortes/delivery-config")
def update_delivery_config(
    body: DeliveryConfigBody,
    db=Depends(get_db),
    payload: dict = Depends(verify_token),
):
    _require_admin(payload, db)
    if body.fee_per_order <= 0 or body.min_daily_fee <= 0:
        raise HTTPException(status_code=400, detail="Los montos deben ser positivos")
    db.config.update_one(
        {"_id": DELIVERY_CONFIG_ID},
        {"$set": {
            "fee_per_order": body.fee_per_order,
            "min_daily_fee": body.min_daily_fee,
            "updatedAt":     datetime.now(timezone.utc),
        }},
        upsert=True,
    )
    return {"fee_per_order": body.fee_per_order, "min_daily_fee": body.min_daily_fee}


# ─── Op-cost-types config endpoints ──────────────────────────────────────────

@router.get("/api/cortes/op-cost-types")
def get_op_cost_types(db=Depends(get_db), payload: dict = Depends(verify_token)):
    return _get_op_cost_types(db)


class OpCostTypesBody(BaseModel):
    types:    list
    services: list


@router.put("/api/cortes/op-cost-types")
def update_op_cost_types(
    body: OpCostTypesBody,
    db=Depends(get_db),
    payload: dict = Depends(verify_token),
):
    _require_admin(payload, db)
    db.config.update_one(
        {"_id": OP_COST_TYPES_ID},
        {"$set": {"types": body.types, "updatedAt": datetime.now(timezone.utc)}},
        upsert=True,
    )
    db.config.update_one(
        {"_id": OP_COST_SERVICES_ID},
        {"$set": {"services": body.services, "updatedAt": datetime.now(timezone.utc)}},
        upsert=True,
    )
    return {"types": body.types, "services": body.services}


# ─── Delivery preview ────────────────────────────────────────────────────────

@router.get("/api/cortes/delivery-preview")
def delivery_preview(
    start: str = Query(...),
    end:   str = Query(...),
    db=Depends(get_db),
    payload: dict = Depends(verify_token),
):
    _require_admin(payload, db)
    start_dt = _parse_dt(start)
    end_dt   = _parse_dt(end)

    txs = list(db.transactions.find(
        {
            "delivery_status": "delivered",
            "delivered_at": {"$gte": start_dt, "$lte": end_dt},
            "operational_costs": {"$exists": True, "$ne": []},
        },
        {"delivery_assigned_to": 1, "delivery_assigned_name": 1,
         "operational_costs": 1, "order_number": 1, "delivered_at": 1, "total": 1},
    ))

    delivery_map: dict = {}

    for tx in txs:
        assigned_id = str(tx.get("delivery_assigned_to", ""))
        if not assigned_id:
            continue

        delivery_items = [
            item for item in (tx.get("operational_costs") or [])
            if item.get("type_key") == "delivery"
            and str(item.get("responsible_id", "")) == assigned_id
        ]
        if not delivery_items:
            continue

        tx_total = sum(float(i.get("amount") or 0) for i in delivery_items)

        if assigned_id not in delivery_map:
            delivery_map[assigned_id] = {
                "delivery_user_id":   assigned_id,
                "delivery_user_name": tx.get("delivery_assigned_name", "Desconocido"),
                "total_pay":          0.0,
                "deliveries":         [],
            }

        delivery_map[assigned_id]["total_pay"] += tx_total
        delivery_map[assigned_id]["deliveries"].append({
            "tx_id":        str(tx["_id"]),
            "order_number": tx.get("order_number", ""),
            "delivered_at": tx["delivered_at"].isoformat() if tx.get("delivered_at") else None,
            "amount":       round(tx_total, 2),
        })

    result = []
    for data in delivery_map.values():
        data["total_pay"]   = round(data["total_pay"], 2)
        data["delivery_count"] = len(data["deliveries"])
        result.append(data)

    return {
        "deliveries": sorted(result, key=lambda x: x["total_pay"], reverse=True),
        "total_pay":  round(sum(d["total_pay"] for d in result), 2),
    }


# ─── Preview (sin persistir) ─────────────────────────────────────────────────

@router.get("/api/cortes/preview")
def preview_corte(
    start: str = Query(...),
    end:   str = Query(...),
    db=Depends(get_db),
    payload: dict = Depends(verify_token),
):
    _require_admin(payload, db)
    start_dt = _parse_dt(start)
    end_dt   = _parse_dt(end)
    config   = _get_config(db)
    sellers  = _build_preview(start_dt, end_dt, db, config)
    return {
        "sellers":           sellers,
        "total_ingresos":    round(sum(s["total_ingresos"] for s in sellers), 2),
        "total_cogs":        round(sum(s["total_cogs"]     for s in sellers), 2),
        "total_utilidad":    round(sum(s["utilidad"]       for s in sellers), 2),
        "total_seller_cuts": round(sum(s["seller_cut"]     for s in sellers), 2),
        "total_royale_cuts": round(sum(s["royale_cut"]     for s in sellers), 2),
        "config":            config,
    }


# ─── CRUD de cortes ──────────────────────────────────────────────────────────

class CorteBody(BaseModel):
    label:        str
    period_start: str
    period_end:   str


@router.post("/api/cortes")
def create_corte(body: CorteBody, db=Depends(get_db), payload: dict = Depends(verify_token)):
    _require_admin(payload, db)
    start_dt = _parse_dt(body.period_start)
    end_dt   = _parse_dt(body.period_end)
    config   = _get_config(db)
    sellers  = _build_preview(start_dt, end_dt, db, config)

    if not sellers:
        raise HTTPException(status_code=400,
                            detail="No hay transacciones de vendedores en ese período")

    now = datetime.now(timezone.utc)
    seller_docs = [
        {
            "seller_id":      ObjectId(s["seller_id"]),
            "seller_name":    s["seller_name"],
            "total_ingresos": s["total_ingresos"],
            "total_cogs":     s["total_cogs"],
            "utilidad":       s["utilidad"],
            "seller_cut":     s["seller_cut"],
            "royale_cut":     s["royale_cut"],
            "tx_count":       s["tx_count"],
            "paid":           False,
            "paid_at":        None,
        }
        for s in sellers
    ]

    doc = {
        "label":             body.label,
        "period_start":      start_dt,
        "period_end":        end_dt,
        "royale_pct":        config["royale_pct"],
        "seller_pct":        config["seller_pct"],
        "sellers":           seller_docs,
        "total_ingresos":    round(sum(s["total_ingresos"] for s in sellers), 2),
        "total_cogs":        round(sum(s["total_cogs"]     for s in sellers), 2),
        "total_utilidad":    round(sum(s["utilidad"]       for s in sellers), 2),
        "total_seller_cuts": round(sum(s["seller_cut"]     for s in sellers), 2),
        "total_royale_cuts": round(sum(s["royale_cut"]     for s in sellers), 2),
        "createdAt":         now,
        "createdBy":         ObjectId(payload["id"]),
    }
    result = db.cortes.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _serialize_corte(doc)


@router.get("/api/cortes")
def list_cortes(db=Depends(get_db), payload: dict = Depends(verify_token)):
    user = _get_user(payload, db)
    if user.get("rol") == 1:
        docs = list(db.cortes.find({}).sort("createdAt", -1))
        return [_serialize_corte(d) for d in docs]
    else:
        uid = ObjectId(payload["id"])
        docs = list(db.cortes.find({"sellers.seller_id": uid}).sort("createdAt", -1))
        result = []
        for d in docs:
            c = _serialize_corte(d)
            c["sellers"] = [s for s in c["sellers"] if s["seller_id"] == str(uid)]
            result.append(c)
        return result


@router.get("/api/cortes/{corte_id}")
def get_corte(corte_id: str, db=Depends(get_db), payload: dict = Depends(verify_token)):
    user = _get_user(payload, db)
    doc  = db.cortes.find_one({"_id": to_object_id(corte_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Corte no encontrado")
    c = _serialize_corte(doc)
    if user.get("rol") != 1:
        uid = str(ObjectId(payload["id"]))
        c["sellers"] = [s for s in c["sellers"] if s["seller_id"] == uid]
    return c


@router.delete("/api/cortes/{corte_id}")
def delete_corte(corte_id: str, db=Depends(get_db), payload: dict = Depends(verify_token)):
    _require_admin(payload, db)
    doc = db.cortes.find_one({"_id": to_object_id(corte_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Corte no encontrado")
    db.cortes.delete_one({"_id": doc["_id"]})
    return {"message": "Corte eliminado"}


@router.put("/api/cortes/{corte_id}/paid/{seller_id}")
def mark_paid(corte_id: str, seller_id: str, db=Depends(get_db), payload: dict = Depends(verify_token)):
    _require_admin(payload, db)
    corte_oid  = to_object_id(corte_id)
    seller_oid = ObjectId(seller_id)
    now        = datetime.now(timezone.utc)

    corte = db.cortes.find_one({"_id": corte_oid})
    if not corte:
        raise HTTPException(status_code=404, detail="Corte no encontrado")

    seller_entry = next((s for s in corte.get("sellers", []) if str(s["seller_id"]) == seller_id), None)
    if not seller_entry:
        raise HTTPException(status_code=404, detail="Vendedor no encontrado en este corte")

    existing_tx_id = seller_entry.get("transaction_id")

    if existing_tx_id:
        # Reactivar transacción existente (fue revertida antes)
        db.transactions.update_one(
            {"_id": existing_tx_id},
            {"$set": {"active": True, "updatedAt": now}},
        )
        tx_id = existing_tx_id
    else:
        # Crear transacción de salida — Día de Corte
        tx_doc = {
            "fin_type":    "salida",
            "label":       "Pago de Corte",
            "is_manual":   True,
            "category":    "Día de Corte",
            "description": f"Pago a {seller_entry['seller_name']} — {corte.get('label', '')}",
            "total":       round(seller_entry.get("seller_cut", 0), 2),
            "active":      True,
            "corte_id":    corte_oid,
            "seller_id":   seller_oid,
            "status":      2,
            "omitted":     False,
            "order_number": generate_order_number(db),
            "createdAt":   now,
            "updatedAt":   now,
        }
        tx_id = db.transactions.insert_one(tx_doc).inserted_id

    db.cortes.update_one(
        {"_id": corte_oid, "sellers.seller_id": seller_oid},
        {"$set": {
            "sellers.$.paid":           True,
            "sellers.$.paid_at":        now,
            "sellers.$.transaction_id": tx_id,
        }},
    )
    return {"message": "Marcado como pagado", "transaction_id": str(tx_id)}


@router.put("/api/cortes/{corte_id}/unpaid/{seller_id}")
def mark_unpaid(corte_id: str, seller_id: str, db=Depends(get_db), payload: dict = Depends(verify_token)):
    _require_admin(payload, db)
    corte_oid  = to_object_id(corte_id)
    seller_oid = ObjectId(seller_id)
    now        = datetime.now(timezone.utc)

    corte = db.cortes.find_one({"_id": corte_oid})
    if not corte:
        raise HTTPException(status_code=404, detail="Corte no encontrado")

    seller_entry = next((s for s in corte.get("sellers", []) if str(s["seller_id"]) == seller_id), None)
    if not seller_entry:
        raise HTTPException(status_code=404, detail="Vendedor no encontrado en este corte")

    # Desactivar la transacción (queda en BD pero excluida de gráficas)
    tx_id = seller_entry.get("transaction_id")
    if tx_id:
        db.transactions.update_one(
            {"_id": tx_id},
            {"$set": {"active": False, "updatedAt": now}},
        )

    db.cortes.update_one(
        {"_id": corte_oid, "sellers.seller_id": seller_oid},
        {"$set": {"sellers.$.paid": False, "sellers.$.paid_at": None}},
    )
    return {"message": "Marcado como pendiente"}


# ─── Resumen global del vendedor (para su dashboard) ────────────────────────

@router.get("/api/cortes/seller/summary")
def seller_summary(db=Depends(get_db), payload: dict = Depends(verify_token)):
    uid  = ObjectId(payload["id"])
    docs = list(db.cortes.find({"sellers.seller_id": uid}))
    total_earned  = 0.0
    total_paid    = 0.0
    total_pending = 0.0

    for d in docs:
        for s in d.get("sellers", []):
            if s.get("seller_id") == uid:
                cut = float(s.get("seller_cut") or 0)
                total_earned += cut
                if s.get("paid"):
                    total_paid += cut
                else:
                    total_pending += cut

    return {
        "total_earned":  round(total_earned, 2),
        "total_paid":    round(total_paid, 2),
        "total_pending": round(total_pending, 2),
        "corte_count":   len(docs),
    }
