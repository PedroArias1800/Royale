import math
from typing import Optional
from fastapi import APIRouter, Depends, Query, UploadFile, File, Form
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from bson import ObjectId

from database import get_db
from auth import verify_token
from helpers import serialize_doc, to_object_id
from storage import upload_file

router = APIRouter()


class FilterBody(BaseModel):
    filter: str = ""
    countSell: int = 0


def _type_with_parfum(doc: dict, db) -> dict:
    s = serialize_doc(doc)
    if s and doc.get("parfum_id_fk"):
        parfum = db.parfums.find_one({"_id": doc["parfum_id_fk"]}, {"title": 1, "brand_id_fk": 1})
        if parfum:
            s["parfum_id_fk"] = serialize_doc(parfum)
    return s


def _calc_profit(doc: dict, profit: float) -> dict:
    cost = doc.get("cost") or 0
    price = doc.get("seller_profit") or doc.get("price")
    price_val = price if isinstance(price, (int, float)) and price > 0 else None
    price_flash_val = doc.get("price_flash") if isinstance(doc.get("price_flash"), (int, float)) and doc.get("price_flash", 0) > 0 else None

    seller_profit = round((price_val - cost) * profit, 2) if price_val is not None else None
    flash_seller_profit = round((price_flash_val - cost) * profit, 2) if price_flash_val is not None else None

    if flash_seller_profit is None or flash_seller_profit == seller_profit:
        flash_seller_profit = seller_profit

    doc["seller_profit"] = str(seller_profit) if seller_profit is not None else None
    doc["flash_seller_profit"] = str(flash_seller_profit) if flash_seller_profit is not None else None
    return doc


@router.get("/api/types/all")
def get_all_types(_: dict = Depends(verify_token)):
    db = get_db()
    pipeline = [
        {"$lookup": {"from": "parfums", "localField": "parfum_id_fk", "foreignField": "_id", "as": "parfum_data"}},
        {"$unwind": "$parfum_data"},
        {"$sort": {"parfum_data.title": 1}},
        {"$addFields": {"parfum_id_fk": "$parfum_data"}},
        {"$project": {"parfum_data": 0}},
    ]
    return [serialize_doc(d) for d in db.types.aggregate(pipeline)]


@router.post("/api/types")
def post_get_types(body: FilterBody, _: dict = Depends(verify_token), page: int = Query(default=1)):
    db = get_db()
    limit = 15
    skip = (page - 1) * limit
    count_sell = body.countSell

    profit = 0.50
    if 6 <= count_sell <= 8:
        profit = 0.55
    elif count_sell >= 9:
        profit = 0.60

    pipeline = [
        {"$lookup": {"from": "parfums", "localField": "parfum_id_fk", "foreignField": "_id", "as": "parfum_data"}},
        {"$unwind": "$parfum_data"},
        {"$sort": {"parfum_data.title": 1}},
        {"$skip": skip},
        {"$limit": limit},
        {"$addFields": {"parfum_id_fk": "$parfum_data"}},
        {"$project": {"parfum_data": 0}},
    ]
    types = [serialize_doc(d) for d in db.types.aggregate(pipeline)]
    types_with_profit = [_calc_profit(t, profit) for t in types]

    total = db.types.count_documents({})
    return {
        "data": types_with_profit,
        "pagination": {
            "currentPage": page,
            "totalPages": math.ceil(total / limit),
            "totalItems": total,
            "itemsPerPage": limit,
        },
    }


@router.post("/api/types/filtered")
def get_filtered_types(body: FilterBody, _: dict = Depends(verify_token), page: int = Query(default=1)):
    db = get_db()
    f = body.filter
    limit = 15
    skip = (page - 1) * limit

    status_filter = None
    if f and "activado".startswith(f.lower()):
        status_filter = 1
    elif f and "desactivado".startswith(f.lower()):
        status_filter = 0

    query = {}
    if f:
        or_clauses = [
            {"ml": {"$regex": f, "$options": "i"}},
            {"description": {"$regex": f, "$options": "i"}},
        ]
        if status_filter is not None:
            or_clauses.append({"status": status_filter})
        query = {"$or": or_clauses}

    pipeline = [
        {"$match": query},
        {"$lookup": {"from": "parfums", "localField": "parfum_id_fk", "foreignField": "_id", "as": "parfum_data"}},
        {"$unwind": "$parfum_data"},
        {"$sort": {"parfum_data.title": 1}},
        {"$skip": skip},
        {"$limit": limit},
        {"$addFields": {"parfum_id_fk": "$parfum_data"}},
        {"$project": {"parfum_data": 0}},
    ]
    types = [serialize_doc(d) for d in db.types.aggregate(pipeline)]
    total = db.types.count_documents(query)

    return {
        "data": types,
        "pagination": {
            "currentPage": page,
            "totalPages": math.ceil(total / limit),
            "totalItems": total,
            "itemsPerPage": limit,
        },
    }


@router.get("/api/type/parfum/{parfumId}")
def get_type_by_parfum_id(parfumId: str):
    db = get_db()
    types = list(db.types.find(
        {"parfum_id_fk": to_object_id(parfumId)},
        {"ml": 1, "price": 1, "price_flash": 1},
    ))
    if not types:
        return JSONResponse(status_code=404, content={"message": "Type not Found"})
    return [serialize_doc(t) for t in types]


@router.get("/api/type")
def get_type(_: dict = Depends(verify_token), id: str = Query(default=None)):
    if not id:
        return JSONResponse(status_code=404, content={"message": "Type not Found"})
    db = get_db()
    doc = db.types.find_one({"_id": to_object_id(id)})
    if not doc:
        return JSONResponse(status_code=404, content={"message": "Type not Found"})
    return serialize_doc(doc)


@router.post("/api/type")
async def create_type(
    _: dict = Depends(verify_token),
    ml: str = Form(...),
    cost: float = Form(...),
    price: float = Form(...),
    old_price: float = Form(...),
    status: int = Form(...),
    type_of_sale: str = Form(...),
    price_flash: float = Form(...),
    quantity_flash: int = Form(...),
    parfum_id_fk: str = Form(...),
    imgServer: Optional[str] = Form(default=None),
    img: Optional[UploadFile] = File(default=None),
):
    db = get_db()
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)

    img_url = None
    if img and img.filename:
        content = await img.read()
        img_url = upload_file(content, img.filename, "parfumIcon")
    elif imgServer:
        img_url = imgServer

    doc = {
        "ml": ml, "img": img_url, "cost": cost, "price": price,
        "old_price": old_price, "status": status, "type_of_sale": type_of_sale,
        "price_flash": price_flash, "quantity_flash": quantity_flash,
        "parfum_id_fk": ObjectId(parfum_id_fk),
        "createdAt": now, "updatedAt": now,
    }
    result = db.types.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_doc(doc)


@router.put("/api/type/{id}")
async def update_type(
    id: str,
    _: dict = Depends(verify_token),
    ml: str = Form(...),
    cost: float = Form(...),
    price: float = Form(...),
    old_price: float = Form(...),
    status: int = Form(...),
    type_of_sale: str = Form(...),
    price_flash: float = Form(...),
    quantity_flash: int = Form(...),
    parfum_id_fk: str = Form(...),
    imgServer: Optional[str] = Form(default=None),
    img: Optional[UploadFile] = File(default=None),
):
    db = get_db()
    from datetime import datetime, timezone

    img_url = None
    if img and img.filename:
        content = await img.read()
        img_url = upload_file(content, img.filename, "parfumIcon")
    elif imgServer:
        img_url = imgServer

    update_data = {
        "ml": ml, "cost": cost, "price": price, "old_price": old_price,
        "status": status, "type_of_sale": type_of_sale, "price_flash": price_flash,
        "quantity_flash": quantity_flash, "parfum_id_fk": ObjectId(parfum_id_fk),
        "updatedAt": datetime.now(timezone.utc),
    }
    if img_url:
        update_data["img"] = img_url

    doc = db.types.find_one_and_update(
        {"_id": to_object_id(id)}, {"$set": update_data}, return_document=True
    )
    if not doc:
        return JSONResponse(status_code=404, content={"message": "Type not Found"})
    return serialize_doc(doc)


@router.delete("/api/type/{id}")
def delete_type(id: str, _: dict = Depends(verify_token)):
    db = get_db()
    doc = db.types.find_one_and_delete({"_id": to_object_id(id)})
    if not doc:
        return JSONResponse(status_code=404, content={"message": "Type not Found"})
    return serialize_doc(doc)
