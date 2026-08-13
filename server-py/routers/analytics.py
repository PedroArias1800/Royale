from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query
from typing import Optional
from bson import ObjectId

from database import get_db
from auth import verify_token

router = APIRouter()


def _parse_range(start: Optional[str], end: Optional[str]):
    now = datetime.now(timezone.utc)
    if start:
        start_dt = datetime.fromisoformat(start)
        if start_dt.tzinfo is None:
            start_dt = start_dt.replace(tzinfo=timezone.utc)
    else:
        start_dt = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    if end:
        end_dt = datetime.fromisoformat(end)
        if end_dt.tzinfo is None:
            end_dt = end_dt.replace(tzinfo=timezone.utc)
    else:
        end_dt = now
    return start_dt, end_dt


# Transacciones de ventas completadas (del checkout del cliente + ingresos manuales procesados)
def _income_match(start_dt, end_dt):
    return {
        "createdAt": {"$gte": start_dt, "$lte": end_dt},
        "status": 2,
        "omitted": {"$ne": True},
        "$or": [
            {"fin_type": {"$exists": False}},
            {"fin_type": None},
            {"fin_type": "ingreso"},
        ],
    }


# Transacciones de salida manuales (active: False = revertidas por Día de Corte, excluidas)
def _expense_match(start_dt, end_dt):
    return {
        "createdAt": {"$gte": start_dt, "$lte": end_dt},
        "fin_type": "salida",
        "is_manual": True,
        "omitted": {"$ne": True},
        "active": {"$ne": False},
    }


@router.get("/api/analytics/summary")
def get_summary(
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None),
    db=Depends(get_db),
    _=Depends(verify_token),
):
    start_dt, end_dt = _parse_range(start, end)

    # --- Ingresos (ventas completadas + ingresos manuales) ---
    income_pipe = [
        {"$match": _income_match(start_dt, end_dt)},
        {
            "$group": {
                "_id": None,
                "total_ingresos": {"$sum": "$total"},
                "count_ventas":   {"$sum": 1},
                "ingresos_ventas": {
                    "$sum": {"$cond": [{"$ne": [{"$ifNull": ["$is_manual", False]}, True]}, "$total", 0]}
                },
                "ingresos_manuales": {
                    "$sum": {"$cond": [{"$eq": ["$is_manual", True]}, "$total", 0]}
                },
            }
        },
    ]
    income_result = list(db.transactions.aggregate(income_pipe))
    total_ingresos    = income_result[0]["total_ingresos"]    if income_result else 0.0
    count_ventas      = income_result[0]["count_ventas"]      if income_result else 0
    ingresos_ventas   = income_result[0]["ingresos_ventas"]   if income_result else 0.0
    ingresos_manuales = income_result[0]["ingresos_manuales"] if income_result else 0.0

    # --- COGS: usa products_cost/operational_cost almacenados; fallback a cost de tipos ---
    income_txs = list(db.transactions.find(
        _income_match(start_dt, end_dt),
        {"products_cost": 1, "operational_cost": 1, "productsTypes": 1, "quantities": 1},
    ))
    cogs = 0.0
    needs_type_lookup = []
    for tx in income_txs:
        if tx.get("products_cost") is not None:
            cogs += tx["products_cost"]
        else:
            for pt, qty in zip(tx.get("productsTypes", []), tx.get("quantities", [])):
                try:
                    needs_type_lookup.append((ObjectId(pt), int(qty or 1)))
                except Exception:
                    pass
        if tx.get("operational_cost"):
            cogs += tx["operational_cost"]
    if needs_type_lookup:
        type_ids = list({str(oid): oid for oid, _ in needs_type_lookup}.values())
        types_cost = {
            str(t["_id"]): t.get("cost", 0)
            for t in db.types.find({"_id": {"$in": type_ids}}, {"cost": 1})
        }
        for oid, qty in needs_type_lookup:
            cogs += types_cost.get(str(oid), 0) * qty

    # --- Salidas manuales (tipo "salida") ---
    expense_pipe = [
        {"$match": _expense_match(start_dt, end_dt)},
        {"$group": {"_id": None, "total_salidas": {"$sum": "$total"}}},
    ]
    expense_result = list(db.transactions.aggregate(expense_pipe))
    total_salidas_manuales = expense_result[0]["total_salidas"] if expense_result else 0.0

    total_salidas = cogs + total_salidas_manuales
    balance = total_ingresos - total_salidas
    base = total_ingresos if total_ingresos > 0 else ingresos_ventas
    margen_bruto = round((base - cogs) / base * 100, 2) if base > 0 else 0.0

    return {
        "ingresos": round(total_ingresos, 2),
        "ingresos_ventas": round(ingresos_ventas, 2),
        "ingresos_manuales": round(ingresos_manuales, 2),
        "salidas": round(total_salidas, 2),
        "cogs": round(cogs, 2),
        "salidas_manuales": round(total_salidas_manuales, 2),
        "balance": round(balance, 2),
        "margen_bruto": margen_bruto,
        "count_ventas": count_ventas,
    }


@router.get("/api/analytics/trends")
def get_trends(
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None),
    granularity: str = Query("day"),
    db=Depends(get_db),
    _=Depends(verify_token),
):
    start_dt, end_dt = _parse_range(start, end)
    fmt_map = {"day": "%Y-%m-%d", "week": "%Y-%V", "month": "%Y-%m"}
    fmt = fmt_map.get(granularity, "%Y-%m-%d")

    income_pipe = [
        {"$match": _income_match(start_dt, end_dt)},
        {
            "$group": {
                "_id": {"$dateToString": {"format": fmt, "date": "$createdAt"}},
                "ingresos": {"$sum": "$total"},
            }
        },
        {"$sort": {"_id": 1}},
    ]
    income_by_period = {r["_id"]: r["ingresos"] for r in db.transactions.aggregate(income_pipe)}

    # Salidas manuales (fin_type=salida)
    expense_pipe = [
        {"$match": _expense_match(start_dt, end_dt)},
        {
            "$group": {
                "_id": {"$dateToString": {"format": fmt, "date": "$createdAt"}},
                "salidas": {"$sum": "$total"},
            }
        },
    ]
    expense_by_period = {r["_id"]: r["salidas"] for r in db.transactions.aggregate(expense_pipe)}

    # COGS de ingresos (products_cost + operational_cost) por período
    cogs_pipe = [
        {"$match": _income_match(start_dt, end_dt)},
        {
            "$group": {
                "_id": {"$dateToString": {"format": fmt, "date": "$createdAt"}},
                "cogs": {
                    "$sum": {
                        "$add": [
                            {"$ifNull": ["$products_cost", 0]},
                            {"$ifNull": ["$operational_cost", 0]},
                        ]
                    }
                },
            }
        },
    ]
    cogs_by_period = {r["_id"]: r["cogs"] for r in db.transactions.aggregate(cogs_pipe)}

    all_periods = sorted(set(list(income_by_period) + list(expense_by_period) + list(cogs_by_period)))

    rows = [
        {
            "period":   p,
            "ingresos": round(income_by_period.get(p, 0), 2),
            "salidas":  round(expense_by_period.get(p, 0) + cogs_by_period.get(p, 0), 2),
            "balance":  round(
                income_by_period.get(p, 0)
                - expense_by_period.get(p, 0)
                - cogs_by_period.get(p, 0),
                2,
            ),
        }
        for p in all_periods
    ]

    # Balance acumulado: suma continua de la utilidad período a período
    running = 0.0
    for row in rows:
        running = round(running + row["balance"], 2)
        row["balance"] = running

    return rows


@router.get("/api/analytics/breakdown")
def get_breakdown(
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None),
    by: str = Query("label"),
    db=Depends(get_db),
    _=Depends(verify_token),
):
    start_dt, end_dt = _parse_range(start, end)
    result = []

    if by == "label":
        # Etiquetas en transacciones procesadas (tanto ventas como manuales)
        pipe = [
            {
                "$match": {
                    "createdAt": {"$gte": start_dt, "$lte": end_dt},
                    "status": 2,
                    "label": {"$exists": True, "$ne": None, "$ne": ""},
                }
            },
            {
                "$group": {
                    "_id": "$label",
                    "total": {"$sum": "$total"},
                    "count": {"$sum": 1},
                }
            },
            {"$sort": {"total": -1}},
        ]
        result = [{"name": r["_id"], "value": round(r["total"], 2), "count": r["count"]}
                  for r in db.transactions.aggregate(pipe)]

    elif by in ("payment", "delivery", "channel"):
        field_map = {"payment": "payment_method", "delivery": "delivery_method", "channel": "channel"}
        field = field_map[by]
        pipe = [
            {"$match": {**_income_match(start_dt, end_dt), field: {"$exists": True, "$ne": None, "$ne": ""}}},
            {
                "$group": {
                    "_id": f"${field}",
                    "total": {"$sum": "$total"},
                    "count": {"$sum": 1},
                }
            },
            {"$sort": {"total": -1}},
        ]
        result = [{"name": r["_id"] or "Sin datos", "value": round(r["total"], 2), "count": r["count"]}
                  for r in db.transactions.aggregate(pipe)]

    elif by == "seller":
        pipe = [
            {"$match": {**_income_match(start_dt, end_dt), "seller_id_fk": {"$exists": True, "$ne": None}}},
            {"$group": {"_id": "$seller_id_fk", "total": {"$sum": "$total"}, "count": {"$sum": 1}}},
            {"$sort": {"total": -1}},
        ]
        for r in db.transactions.aggregate(pipe):
            if r["_id"]:
                try:
                    user = db.users.find_one({"_id": ObjectId(str(r["_id"]))}, {"firstname": 1, "lastname": 1})
                    name = f"{user['firstname']} {user['lastname']}" if user else "Desconocido"
                except Exception:
                    name = str(r["_id"])
            else:
                name = "Sitio Web"
            result.append({"name": name, "value": round(r["total"], 2), "count": r["count"]})

    return result


@router.get("/api/analytics/top-products")
def get_top_products(
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None),
    limit: int = Query(10),
    db=Depends(get_db),
    _=Depends(verify_token),
):
    start_dt, end_dt = _parse_range(start, end)
    pipe = [
        {"$match": _income_match(start_dt, end_dt)},
        {"$project": {
            "pairs": {"$zip": {"inputs": [
                {"$ifNull": ["$products", []]},
                {"$ifNull": ["$quantities", []]},
            ]}}
        }},
        {"$unwind": "$pairs"},
        {"$project": {
            "product_str": {"$arrayElemAt": ["$pairs", 0]},
            "qty": {"$toInt": {"$ifNull": [{"$arrayElemAt": ["$pairs", 1]}, 1]}},
        }},
        {"$group": {
            "_id": "$product_str",
            "units": {"$sum": "$qty"},
            "orders": {"$sum": 1},
        }},
        {"$sort": {"units": -1}},
        {"$limit": limit},
    ]
    result = []
    for r in db.transactions.aggregate(pipe):
        product_str = r["_id"] or ""
        parts = product_str.split("=", 1)
        name = parts[1] if len(parts) > 1 else (parts[0] or "Desconocido")
        result.append({"name": name, "units": r["units"], "orders": r["orders"]})
    return result
