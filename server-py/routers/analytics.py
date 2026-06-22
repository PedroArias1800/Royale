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


# Transacciones de salida manuales
def _expense_match(start_dt, end_dt):
    return {
        "createdAt": {"$gte": start_dt, "$lte": end_dt},
        "fin_type": "salida",
        "is_manual": True,
        "omitted": {"$ne": True},
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
                "count_ventas": {
                    "$sum": {"$cond": [{"$ne": [{"$ifNull": ["$is_manual", False]}, True]}, 1, 0]}
                },
                "ingresos_ventas": {
                    "$sum": {"$cond": [{"$ne": [{"$ifNull": ["$is_manual", False]}, True]}, "$total", 0]}
                },
                "ingresos_manuales": {
                    "$sum": {"$cond": [{"$eq": ["$is_manual", True]}, "$total", 0]}
                },
                "all_productsTypes": {"$push": "$productsTypes"},
                "all_quantities": {"$push": "$quantities"},
            }
        },
    ]
    income_result = list(db.transactions.aggregate(income_pipe))
    total_ingresos = income_result[0]["total_ingresos"] if income_result else 0.0
    count_ventas = income_result[0]["count_ventas"] if income_result else 0
    ingresos_ventas = income_result[0]["ingresos_ventas"] if income_result else 0.0
    ingresos_manuales = income_result[0]["ingresos_manuales"] if income_result else 0.0

    # --- COGS: costo de productos vendidos ---
    cogs = 0.0
    if income_result:
        flat_types, flat_qtys = [], []
        for pt_list, qty_list in zip(income_result[0]["all_productsTypes"], income_result[0]["all_quantities"]):
            for pt, qty in zip(pt_list or [], qty_list or []):
                try:
                    flat_types.append(ObjectId(pt))
                    flat_qtys.append(qty)
                except Exception:
                    pass
        if flat_types:
            types_cost = {
                str(t["_id"]): t.get("cost", 0)
                for t in db.types.find({"_id": {"$in": flat_types}}, {"cost": 1})
            }
            for oid, qty in zip(flat_types, flat_qtys):
                cogs += types_cost.get(str(oid), 0) * qty

    # --- Salidas manuales ---
    expense_pipe = [
        {"$match": _expense_match(start_dt, end_dt)},
        {"$group": {"_id": None, "total_salidas": {"$sum": "$total"}}},
    ]
    expense_result = list(db.transactions.aggregate(expense_pipe))
    total_salidas_manuales = expense_result[0]["total_salidas"] if expense_result else 0.0

    total_salidas = cogs + total_salidas_manuales
    balance = total_ingresos - total_salidas
    margen_bruto = round((ingresos_ventas - cogs) / ingresos_ventas * 100, 2) if ingresos_ventas > 0 else 0.0

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

    all_periods = sorted(set(list(income_by_period) + list(expense_by_period)))
    return [
        {
            "period": p,
            "ingresos": round(income_by_period.get(p, 0), 2),
            "salidas": round(expense_by_period.get(p, 0), 2),
        }
        for p in all_periods
    ]


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
            {"$match": {**_income_match(start_dt, end_dt), "is_manual": {"$ne": True}}},
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
