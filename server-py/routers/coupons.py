from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from database import get_db
from auth import verify_token
from helpers import serialize_doc, paginate_cursor, to_object_id

router = APIRouter()


class CouponBody(BaseModel):
    title: str
    code: str
    percentage: float
    productsThatApply: int
    status: int


class FilterBody(BaseModel):
    filter: str = ""


@router.get("/api/coupons/all")
def get_all_coupons(_: dict = Depends(verify_token)):
    db = get_db()
    return [serialize_doc(d) for d in db.coupons.find().sort("title", 1)]


@router.get("/api/coupons")
def get_coupons(_: dict = Depends(verify_token), page: int = Query(default=1)):
    db = get_db()
    query = {}
    cursor = db.coupons.find(query).sort("title", 1)
    return paginate_cursor(cursor, db.coupons, query, page)


@router.post("/api/coupons/filtered")
def get_filtered_coupons(body: FilterBody, _: dict = Depends(verify_token), page: int = Query(default=1)):
    db = get_db()
    f = body.filter
    query = {"$or": [
        {"title": {"$regex": f, "$options": "i"}},
        {"code": {"$regex": f, "$options": "i"}},
    ]} if f else {}
    cursor = db.coupons.find(query).sort("title", 1)
    return paginate_cursor(cursor, db.coupons, query, page)


@router.get("/api/coupon")
def get_coupon(_: dict = Depends(verify_token), id: str = Query(default=None)):
    if not id:
        return JSONResponse(status_code=404, content={"message": "Coupon not Found"})
    db = get_db()
    doc = db.coupons.find_one({"_id": to_object_id(id)})
    if not doc:
        return JSONResponse(status_code=404, content={"message": "Coupon not Found"})
    return serialize_doc(doc)


@router.post("/api/coupon")
def create_coupon(body: CouponBody, _: dict = Depends(verify_token)):
    db = get_db()
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    doc = {
        "title": body.title, "code": body.code, "percentage": body.percentage,
        "productsThatApply": body.productsThatApply, "status": body.status,
        "createdAt": now, "updatedAt": now,
    }
    result = db.coupons.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_doc(doc)


@router.put("/api/coupon/{id}")
def update_coupon(id: str, body: CouponBody, _: dict = Depends(verify_token)):
    db = get_db()
    from datetime import datetime, timezone
    update = {
        "$set": {
            "title": body.title, "code": body.code, "percentage": body.percentage,
            "productsThatApply": body.productsThatApply, "status": body.status,
            "updatedAt": datetime.now(timezone.utc),
        }
    }
    doc = db.coupons.find_one_and_update({"_id": to_object_id(id)}, update, return_document=True)
    if not doc:
        return JSONResponse(status_code=404, content={"message": "Coupon not Found"})
    return serialize_doc(doc)


@router.delete("/api/coupon/{id}")
def delete_coupon(id: str, _: dict = Depends(verify_token)):
    db = get_db()
    doc = db.coupons.find_one_and_delete({"_id": to_object_id(id)})
    if not doc:
        return JSONResponse(status_code=404, content={"message": "Coupon not Found"})
    return serialize_doc(doc)
