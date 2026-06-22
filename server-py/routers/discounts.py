"""
Módulo de Descuentos por Métricas — Royale Panama

Reglas de descuento configurables por atributos de parfums (marca, género, precio,
fecha de creación) con programación automática de activación/desactivación.

Admin (auth):  GET/POST/PUT/DELETE /api/discounts
               POST /api/discounts/preview
               POST /api/discounts/filtered
Público:       GET /discounts/public
"""
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from bson import ObjectId

from database import get_db
from auth import verify_token
from helpers import serialize_doc, to_object_id, paginate_cursor

router = APIRouter()


# ── Modelos ──────────────────────────────────────────────────────────────────

class DiscountBody(BaseModel):
    title: str
    description: str = ""
    discount_pct: float
    status: int = 1
    order_index: int = 0
    filter_brand_ids: List[str] = []
    filter_gender: Optional[int] = None
    filter_price_min: Optional[float] = None
    filter_price_max: Optional[float] = None
    filter_created_after: Optional[str] = None
    filter_created_before: Optional[str] = None
    schedule_enabled: bool = False
    schedule_start: Optional[str] = None
    schedule_end: Optional[str] = None


class PreviewBody(BaseModel):
    filter_brand_ids: List[str] = []
    filter_gender: Optional[int] = None
    filter_price_min: Optional[float] = None
    filter_price_max: Optional[float] = None
    filter_created_after: Optional[str] = None
    filter_created_before: Optional[str] = None


class FilterBody(BaseModel):
    filter: str = ""


# ── Helpers ───────────────────────────────────────────────────────────────────

def _parse_dt(s) -> Optional[datetime]:
    if not s:
        return None
    try:
        return datetime.fromisoformat(str(s).replace("Z", "+00:00"))
    except Exception:
        return None


def _is_rule_active(rule: dict) -> bool:
    if rule.get("status") != 1:
        return False
    if not rule.get("schedule_enabled", False):
        return True
    now = datetime.now(timezone.utc)
    start = _parse_dt(rule.get("schedule_start"))
    end   = _parse_dt(rule.get("schedule_end"))
    if start and now < start:
        return False
    if end and now > end:
        return False
    return True


def _get_matching_parfums(db, filters: dict, limit: int = 0) -> list:
    """
    filters keys (all optional):
      filter_brand_ids: list[str]
      filter_gender: int|None
      filter_price_min: float|None
      filter_price_max: float|None
      filter_created_after: str|None  (ISO)
      filter_created_before: str|None (ISO)
    """
    parfum_q: dict = {"status": 1}

    brand_ids = filters.get("filter_brand_ids") or []
    if brand_ids:
        oids = [ObjectId(b) for b in brand_ids if ObjectId.is_valid(b)]
        if oids:
            parfum_q["brand_id_fk"] = {"$in": oids}

    gender = filters.get("filter_gender")
    if gender is not None:
        parfum_q["gender"] = int(gender)

    date_q: dict = {}
    after  = _parse_dt(filters.get("filter_created_after"))
    before = _parse_dt(filters.get("filter_created_before"))
    if after:
        date_q["$gte"] = after
    if before:
        date_q["$lte"] = before
    if date_q:
        parfum_q["createdAt"] = date_q

    # Type-level price filter
    type_price_q: dict = {"status": 1}
    price_min = filters.get("filter_price_min")
    price_max = filters.get("filter_price_max")
    if price_min is not None or price_max is not None:
        pq: dict = {}
        if price_min is not None:
            pq["$gte"] = float(price_min)
        if price_max is not None:
            pq["$lte"] = float(price_max)
        type_price_q["price"] = pq

    pipeline = [
        {"$match": parfum_q},
        {"$lookup": {
            "from": "types",
            "let": {"pid": "$_id"},
            "pipeline": [
                {"$match": {"$expr": {"$eq": ["$parfum_id_fk", "$$pid"]}}},
                {"$match": type_price_q},
                {"$sort": {"price": 1}},
            ],
            "as": "types",
        }},
        {"$match": {"types.0": {"$exists": True}}},
        {"$lookup": {"from": "brands",   "localField": "brand_id_fk",   "foreignField": "_id", "as": "brand"}},
        {"$lookup": {"from": "versions", "localField": "version_id_fk", "foreignField": "_id", "as": "version"}},
        {"$unwind": "$brand"},
        {"$unwind": "$version"},
        {"$sort": {"createdAt": -1}},
    ]
    if limit:
        pipeline.append({"$limit": limit})

    return list(db.parfums.aggregate(pipeline))


# ── Admin endpoints ───────────────────────────────────────────────────────────

@router.get("/api/discounts")
def get_discounts(_: dict = Depends(verify_token), page: int = Query(default=1)):
    db = get_db()
    cursor = db.discount_rules.find({}).sort([("order_index", 1), ("createdAt", -1)])
    return paginate_cursor(cursor, db.discount_rules, {}, page)


@router.post("/api/discounts/preview")
def preview_discount(body: PreviewBody, _: dict = Depends(verify_token)):
    db = get_db()
    parfums = _get_matching_parfums(db, body.dict(), limit=20)
    return {
        "count": len(parfums),
        "parfums": [serialize_doc(p) for p in parfums],
    }


@router.post("/api/discounts/filtered")
def get_filtered_discounts(body: FilterBody, _: dict = Depends(verify_token), page: int = Query(default=1)):
    db = get_db()
    f = body.filter
    query = {"$or": [
        {"title":       {"$regex": f, "$options": "i"}},
        {"description": {"$regex": f, "$options": "i"}},
    ]} if f else {}
    cursor = db.discount_rules.find(query).sort([("order_index", 1), ("createdAt", -1)])
    return paginate_cursor(cursor, db.discount_rules, query, page)


@router.post("/api/discounts")
def create_discount(body: DiscountBody, _: dict = Depends(verify_token)):
    db = get_db()
    now = datetime.now(timezone.utc)
    doc = {**body.dict(), "createdAt": now, "updatedAt": now}
    result = db.discount_rules.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_doc(doc)


@router.put("/api/discounts/{id}")
def update_discount(id: str, body: DiscountBody, _: dict = Depends(verify_token)):
    db = get_db()
    oid = to_object_id(id)
    update_data = {**body.dict(), "updatedAt": datetime.now(timezone.utc)}
    doc = db.discount_rules.find_one_and_update(
        {"_id": oid},
        {"$set": update_data},
        return_document=True,
    )
    if not doc:
        return JSONResponse(status_code=404, content={"message": "Regla no encontrada"})
    return serialize_doc(doc)


@router.delete("/api/discounts/{id}")
def delete_discount(id: str, _: dict = Depends(verify_token)):
    db = get_db()
    result = db.discount_rules.delete_one({"_id": to_object_id(id)})
    if result.deleted_count == 0:
        return JSONResponse(status_code=404, content={"message": "Regla no encontrada"})
    return {"message": "Eliminado correctamente"}


# ── Endpoint público ──────────────────────────────────────────────────────────

@router.get("/discounts/public")
def get_discounts_public():
    """
    Reglas activas y vigentes con sus parfums que aplican.
    Incluye price_discounted calculado en cada type.
    """
    db = get_db()
    all_rules = list(db.discount_rules.find({"status": 1}).sort([("order_index", 1), ("createdAt", -1)]))

    result = []
    for rule in all_rules:
        if not _is_rule_active(rule):
            continue
        rule_s = serialize_doc(rule)
        discount = float(rule_s.get("discount_pct", 0))

        parfums_raw = _get_matching_parfums(db, rule_s, limit=50)
        parfums_out = []
        for p in parfums_raw:
            p_s = serialize_doc(p)
            for t in p_s.get("types", []):
                t["price_discounted"] = round(float(t.get("price", 0)) * (1 - discount / 100), 2)
            parfums_out.append(p_s)

        rule_s["parfums"] = parfums_out
        result.append(rule_s)

    return result
