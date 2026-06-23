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


def _python_match_parfums(db, filters: dict, limit: int = 0, require_types: bool = True) -> list:
    """
    Python-level matching — avoids aggregation pipeline type/ObjectId mismatches.
    Used for both the preview and the public endpoint.
    """
    # ── Step 1: base parfum query (gender + date; brand handled in Python) ──
    parfum_q: dict = {}

    gender = filters.get("filter_gender")
    if gender is not None:
        try:
            parfum_q["gender"] = int(gender)
        except (TypeError, ValueError):
            pass

    after  = _parse_dt(filters.get("filter_created_after"))
    before = _parse_dt(filters.get("filter_created_before"))
    if after or before:
        dq: dict = {}
        if after:  dq["$gte"] = after
        if before: dq["$lte"] = before
        parfum_q["createdAt"] = dq

    fetch_limit = max(limit * 4, 500) if limit else 500
    all_parfums = list(db.parfums.find(parfum_q).sort("createdAt", -1).limit(fetch_limit))

    # ── Step 2: brand filter in Python ──
    brand_ids = filters.get("filter_brand_ids") or []
    if brand_ids:
        brand_set = {str(b) for b in brand_ids}
        all_parfums = [p for p in all_parfums if str(p.get("brand_id_fk", "")) in brand_set]

    # ── Step 3: types + price filter in Python ──
    price_min = filters.get("filter_price_min")
    price_max = filters.get("filter_price_max")
    apply_price = price_min is not None or price_max is not None

    def _price_ok(t: dict) -> bool:
        try:
            pr = float(t.get("price") or 0)
            if price_min is not None and pr < float(price_min): return False
            if price_max is not None and pr > float(price_max): return False
            return True
        except Exception:
            return False

    results      = []
    brand_cache  = {}
    version_cache = {}

    for p in all_parfums:
        pid = p["_id"]

        # ObjectId match first; fall back to string match for backup data
        types = list(db.types.find({"parfum_id_fk": pid}).sort("price", 1))
        if not types:
            types = list(db.types.find({"parfum_id_fk": str(pid)}).sort("price", 1))

        if apply_price:
            types = [t for t in types if _price_ok(t)]

        if require_types and not types:
            continue

        # Attach brand (cached)
        bf = p.get("brand_id_fk")
        if bf is not None:
            key = str(bf)
            if key not in brand_cache:
                brand_cache[key] = db.brands.find_one({"_id": bf})
            p["brand"] = brand_cache.get(key)

        # Attach version (cached)
        vf = p.get("version_id_fk")
        if vf is not None:
            key = str(vf)
            if key not in version_cache:
                version_cache[key] = db.versions.find_one({"_id": vf})
            p["version"] = version_cache.get(key)

        p["types"] = types[:5]
        results.append(p)

        if limit and len(results) >= limit:
            break

    return results


# ── Admin endpoints ───────────────────────────────────────────────────────────

@router.get("/api/discounts")
def get_discounts(_: dict = Depends(verify_token), page: int = Query(default=1)):
    db = get_db()
    cursor = db.discount_rules.find({}).sort([("order_index", 1), ("createdAt", -1)])
    return paginate_cursor(cursor, db.discount_rules, {}, page)


@router.post("/api/discounts/preview")
def preview_discount(body: PreviewBody, _: dict = Depends(verify_token)):
    db = get_db()
    results = _python_match_parfums(db, body.dict(), limit=0, require_types=True)
    return {
        "count":   len(results),
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

        parfums_raw = _python_match_parfums(db, rule_s, limit=50, require_types=True)
        parfums_out = []
        for p in parfums_raw:
            p_s = serialize_doc(p)
            for t in p_s.get("types", []):
                t["price_discounted"] = round(float(t.get("price", 0)) * (1 - discount / 100), 2)
            parfums_out.append(p_s)

        rule_s["parfums"] = parfums_out
        result.append(rule_s)

    return result
