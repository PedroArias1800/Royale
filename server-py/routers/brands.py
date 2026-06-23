from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from database import get_db
from auth import verify_token
from helpers import serialize_doc, paginate_cursor, to_object_id

router = APIRouter()


class BrandBody(BaseModel):
    brand_name: str


class FilterBody(BaseModel):
    filter: str = ""


@router.get("/api/brands/all")
def get_all_brands(_: dict = Depends(verify_token)):
    db = get_db()
    return [serialize_doc(d) for d in db.brands.find().sort("brand_name", 1)]


@router.get("/api/brands")
def get_brands(_: dict = Depends(verify_token), page: int = Query(default=1)):
    db = get_db()
    query = {}
    cursor = db.brands.find(query).sort("brand_name", 1)
    return paginate_cursor(cursor, db.brands, query, page)


@router.post("/api/brands/filtered")
def get_filtered_brands(body: FilterBody, _: dict = Depends(verify_token), page: int = Query(default=1)):
    db = get_db()
    f = body.filter
    query = {"$or": [{"brand_name": {"$regex": f, "$options": "i"}}]} if f else {}
    cursor = db.brands.find(query).sort("brand_name", 1)
    return paginate_cursor(cursor, db.brands, query, page)


@router.get("/api/brand")
def get_brand(_: dict = Depends(verify_token), id: str = Query(default=None)):
    if not id:
        return JSONResponse(status_code=404, content={"message": "Brand not Found"})
    db = get_db()
    doc = db.brands.find_one({"_id": to_object_id(id)})
    if not doc:
        return JSONResponse(status_code=404, content={"message": "Brand not Found"})
    return serialize_doc(doc)


@router.post("/api/brand")
def create_brand(body: BrandBody, _: dict = Depends(verify_token)):
    db = get_db()
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    doc = {"brand_name": body.brand_name.strip(), "createdAt": now, "updatedAt": now}
    result = db.brands.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_doc(doc)


@router.put("/api/brand/{id}")
def update_brand(id: str, body: BrandBody, _: dict = Depends(verify_token)):
    db = get_db()
    from datetime import datetime, timezone
    doc = db.brands.find_one_and_update(
        {"_id": to_object_id(id)},
        {"$set": {"brand_name": body.brand_name.strip(), "updatedAt": datetime.now(timezone.utc)}},
        return_document=True,
    )
    if not doc:
        return JSONResponse(status_code=404, content={"message": "Brand not Found"})
    return serialize_doc(doc)


@router.delete("/api/brand/{id}")
def delete_brand(id: str, _: dict = Depends(verify_token)):
    db = get_db()
    oid = to_object_id(id)
    if db.parfums.count_documents({"brand_id_fk": oid}) > 0:
        return JSONResponse(status_code=202, content={"message": "Esta Marca está siendo usado en Perfumes, no se puede eliminar."})
    doc = db.brands.find_one_and_delete({"_id": oid})
    if not doc:
        return JSONResponse(status_code=404, content={"message": "Brand not Found"})
    return serialize_doc(doc)
