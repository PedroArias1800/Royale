from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional

from database import get_db
from auth import verify_token
from helpers import serialize_doc, paginate_cursor, to_object_id

router = APIRouter()


class DeliveryBody(BaseModel):
    zone_type: str              # "free" | "province" | "district" | "metro"
    label: str
    province: Optional[str] = None
    district: Optional[str] = None
    metro_line: Optional[str] = None
    metro_station: Optional[str] = None
    price: float = 0.0
    is_free: bool = False
    active: bool = True
    notes: Optional[str] = ""


class FilterBody(BaseModel):
    filter: str = ""


@router.get("/api/delivery/all")
def get_all_delivery(_: dict = Depends(verify_token)):
    db = get_db()
    docs = list(db.delivery_prices.find().sort([("zone_type", 1), ("label", 1)]))
    return [serialize_doc(d) for d in docs]


@router.get("/api/delivery")
def get_delivery(_: dict = Depends(verify_token), page: int = Query(default=1)):
    db = get_db()
    query = {}
    cursor = db.delivery_prices.find(query).sort([("zone_type", 1), ("label", 1)])
    return paginate_cursor(cursor, db.delivery_prices, query, page)


@router.post("/api/delivery/filtered")
def get_filtered_delivery(body: FilterBody, _: dict = Depends(verify_token), page: int = Query(default=1)):
    db = get_db()
    f = body.filter
    query = {"$or": [
        {"label": {"$regex": f, "$options": "i"}},
        {"province": {"$regex": f, "$options": "i"}},
        {"district": {"$regex": f, "$options": "i"}},
        {"metro_line": {"$regex": f, "$options": "i"}},
        {"metro_station": {"$regex": f, "$options": "i"}},
        {"notes": {"$regex": f, "$options": "i"}},
    ]} if f else {}
    cursor = db.delivery_prices.find(query).sort([("zone_type", 1), ("label", 1)])
    return paginate_cursor(cursor, db.delivery_prices, query, page)


@router.post("/api/delivery")
def create_delivery(body: DeliveryBody, _: dict = Depends(verify_token)):
    db = get_db()
    now = datetime.now(timezone.utc)
    doc = {
        "zone_type": body.zone_type,
        "label": body.label,
        "province": body.province or None,
        "district": body.district or None,
        "metro_line": body.metro_line or None,
        "metro_station": body.metro_station or None,
        "price": 0.0 if body.is_free else body.price,
        "is_free": body.is_free,
        "active": body.active,
        "notes": body.notes or "",
        "createdAt": now,
        "updatedAt": now,
    }
    result = db.delivery_prices.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_doc(doc)


@router.put("/api/delivery/{id}")
def update_delivery(id: str, body: DeliveryBody, _: dict = Depends(verify_token)):
    db = get_db()
    update = {
        "zone_type": body.zone_type,
        "label": body.label,
        "province": body.province or None,
        "district": body.district or None,
        "metro_line": body.metro_line or None,
        "metro_station": body.metro_station or None,
        "price": 0.0 if body.is_free else body.price,
        "is_free": body.is_free,
        "active": body.active,
        "notes": body.notes or "",
        "updatedAt": datetime.now(timezone.utc),
    }
    doc = db.delivery_prices.find_one_and_update(
        {"_id": to_object_id(id)}, {"$set": update}, return_document=True
    )
    if not doc:
        return JSONResponse(status_code=404, content={"message": "Precio de delivery no encontrado"})
    return serialize_doc(doc)


@router.delete("/api/delivery/{id}")
def delete_delivery(id: str, _: dict = Depends(verify_token)):
    db = get_db()
    doc = db.delivery_prices.find_one_and_delete({"_id": to_object_id(id)})
    if not doc:
        return JSONResponse(status_code=404, content={"message": "Precio de delivery no encontrado"})
    return serialize_doc(doc)
