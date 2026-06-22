"""
Módulo de Descuentos por Métricas — Royale Panama
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


def _get_matching_parfums(db, filters: dict, limit: int = 0, require_types: bool = False) -> list:
    """
    Retorna parfums que aplican a los filtros dados.
    require_types=True filtra parfums sin tipos (para el endpoint público).
    """
    parfum_q: dict = {}

    brand_ids = filters.get("filter_brand_ids") or []
    if brand_ids:
        oids = [ObjectId(b) for b in brand_ids if ObjectId.is_valid(b)]
        brand_conds = []
        if oids:
            brand_conds.append({"brand_id_fk": {"$in": oids}})
        # Fallback string comparison (backup data may store IDs as strings)
        brand_conds.append({"brand_id_fk": {"$in": brand_ids}})
        parfum_q["$or"] = brand_conds

    gender = filters.get("filter_gender")
    if gender is not None:
        parfum_q["gender"] = int(gender)

    date_q: dict = {}
    after  = _parse_dt(filters.get("filter_created_after"))
    before = _parse_dt(filters.get("filter_created_before"))
    if after:  date_q["$gte"] = after
    if before: date_q["$lte"] = before
    if date_q: parfum_q["createdAt"] = date_q

    # Type-level price filter (only applied when price range is set)
    type_price_stage: list = []
    price_min = filters.get("filter_price_min")
    price_max = filters.get("filter_price_max")
    if price_min is not None or price_max is not None:
        pq: dict = {}
        if price_min is not None: pq["$gte"] = float(price_min)
        if price_max is not None: pq["$lte"] = float(price_max)
        type_price_stage = [{"$match": {"price": pq}}]

    pipeline: list = [
        {"$match": parfum_q},
        {"$lookup": {
            "from": "types",
            "let": {"pid": "$_id"},
            "pipeline": [
                # Handle both ObjectId and string parfum_id_fk (backup data compat)
                {"$match": {"$expr": {
                    "$or": [
                        {"$eq": ["$parfum_id_fk", "$$pid"]},
                        {"$eq": [{"$toString": "$parfum_id_fk"}, {"$toString": "$$pid"}]},
                    ]
                }}},
                *type_price_stage,
                {"$sort": {"price": 1}},
            ],
            "as": "types",
        }},
    ]

    if require_types:
        pipeline.append({"$match": {"types.0": {"$exists": True}}})

    pipeline += [
        {"$lookup": {"from": "brands",   "localField": "brand_id_fk",   "foreignField": "_id", "as": "brand"}},
        {"$lookup": {"from": "versions", "localField": "version_id_fk", "foreignField": "_id", "as": "version"}},
        # preserveNullAndEmptyArrays: parfums without brand/version match are still returned
        {"$unwind": {"path": "$brand",   "preserveNullAndEmptyArrays": True}},
        {"$unwind": {"path": "$version", "preserveNullAndEmptyArrays": True}},
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
    """
    Python-level filtering avoids aggregation pipeline ObjectId/type issues.
    """
    db = get_db()
    f = body.dict()

    # ── Step 1: basic parfum query (brand filter handled in Python) ──
    parfum_q: dict = {}
    gender = f.get("filter_gender")
    if gender is not None:
        parfum_q["gender"] = int(gender)

    after  = _parse_dt(f.get("filter_created_after"))
    before = _parse_dt(f.get("filter_created_before"))
    if after or before:
        dq: dict = {}
        if after:  dq["$gte"] = after
        if before: dq["$lte"] = before
        parfum_q["createdAt"] = dq

    all_parfums = list(db.parfums.find(parfum_q).sort("createdAt", -1).limit(500))

    # ── Step 2: brand filter in Python — str() comparison handles ObjectId/string mismatch ──
    brand_ids = f.get("filter_brand_ids") or []
    if brand_ids:
        brand_set = set(brand_ids)
        all_parfums = [p for p in all_parfums if str(p.get("brand_id_fk", "")) in brand_set]

    # ── Step 3: type + price filter in Python ──
    price_min = f.get("filter_price_min")
    price_max = f.get("filter_price_max")

    def _price_ok(t: dict) -> bool:
        try:
            pr = float(t.get("price", 0))
            if price_min is not None and pr < float(price_min): return False
            if price_max is not None and pr > float(price_max): return False
            return True
        except Exception:
            return False

    results = []
    for p in all_parfums:
        pid = p["_id"]
        types = list(db.types.find({
            "$or": [{"parfum_id_fk": pid}, {"parfum_id_fk": str(pid)}]
        }).sort("price", 1))

        if price_min is not None or price_max is not None:
            types = [t for t in types if _price_ok(t)]

        if not types:
            continue

        brand = db.brands.find_one({"_id": p.get("brand_id_fk")})
        p["brand"] = brand
        p["types"] = types[:3]
        results.append(p)

    return {
        "count": len(results),
        "parfums": [serialize_doc(p) for p in results[:20]],
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
    db = get_db()
    all_rules = list(db.discount_rules.find({"status": 1}).sort([("order_index", 1), ("createdAt", -1)]))

    result = []
    for rule in all_rules:
        if not _is_rule_active(rule):
            continue
        rule_s = serialize_doc(rule)
        discount = float(rule_s.get("discount_pct", 0))

        parfums_raw = _get_matching_parfums(db, rule_s, limit=50, require_types=True)
        parfums_out = []
        for p in parfums_raw:
            p_s = serialize_doc(p)
            for t in p_s.get("types", []):
                t["price_discounted"] = round(float(t.get("price", 0)) * (1 - discount / 100), 2)
            parfums_out.append(p_s)

        rule_s["parfums"] = parfums_out
        result.append(rule_s)

    return result
