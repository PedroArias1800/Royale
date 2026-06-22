import re
from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional

from database import get_db
from auth import verify_token
from helpers import serialize_doc, paginate_cursor, to_object_id

router = APIRouter()


class ParfumBody(BaseModel):
    title: str
    description: str
    gender: int
    status: int
    version_id_fk: str
    brand_id_fk: str


class FilterBody(BaseModel):
    filter: str = ""


def _with_refs(doc: dict, db) -> dict:
    s = serialize_doc(doc)
    if s and doc.get("version_id_fk"):
        v = db.versions.find_one({"_id": doc["version_id_fk"]}, {"version_name": 1})
        s["version_id_fk"] = {"_id": str(v["_id"]), "version_name": v["version_name"]} if v else None
    if s and doc.get("brand_id_fk"):
        b = db.brands.find_one({"_id": doc["brand_id_fk"]}, {"brand_name": 1})
        s["brand_id_fk"] = {"_id": str(b["_id"]), "brand_name": b["brand_name"]} if b else None
    return s


@router.get("/api/parfum")
def get_parfum(_: dict = Depends(verify_token), id: Optional[str] = Query(default=None)):
    if not id:
        return JSONResponse(status_code=404, content={"message": "Parfum not Found"})
    db = get_db()
    parfum = db.parfums.find_one({"_id": to_object_id(id)})
    if not parfum:
        return JSONResponse(status_code=404, content={"message": "Parfum not Found"})
    return _with_refs(parfum, db)


@router.get("/api/parfums/all")
def get_all_parfums(_: dict = Depends(verify_token)):
    db = get_db()
    docs = list(db.parfums.find().sort("title", 1))
    return [_with_refs(d, db) for d in docs]


@router.get("/api/parfums")
def get_parfums(_: dict = Depends(verify_token), page: int = Query(default=1)):
    db = get_db()
    query = {}
    cursor = db.parfums.find(query).sort("title", 1)
    return paginate_cursor(cursor, db.parfums, query, page)


@router.post("/api/parfums/filtered")
def get_filtered_parfums(body: FilterBody, _: dict = Depends(verify_token), page: int = Query(default=1)):
    db = get_db()
    f = body.filter

    gender_filter = None
    if f and "damas".startswith(f.lower()):
        gender_filter = 1
    elif f and "caballeros".startswith(f.lower()):
        gender_filter = 2

    status_filter = None
    if f and "activado".startswith(f.lower()):
        status_filter = 1
    elif f and "desactivado".startswith(f.lower()):
        status_filter = 0

    query = {}
    if f:
        or_clauses = [
            {"title": {"$regex": f, "$options": "i"}},
            {"description": {"$regex": f, "$options": "i"}},
        ]
        if gender_filter is not None:
            or_clauses.append({"gender": gender_filter})
        if status_filter is not None:
            or_clauses.append({"status": status_filter})
        query = {"$or": or_clauses}

    cursor = db.parfums.find(query).sort("title", 1)
    result = paginate_cursor(cursor, db.parfums, query, page)
    result["data"] = [_with_refs(db.parfums.find_one({"_id": to_object_id(d["_id"])}), db) for d in result["data"]]
    return result


@router.post("/api/parfum")
def create_parfum(body: ParfumBody, _: dict = Depends(verify_token)):
    db = get_db()
    from bson import ObjectId
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    doc = {
        "title": body.title,
        "description": body.description,
        "gender": body.gender,
        "status": body.status,
        "version_id_fk": ObjectId(body.version_id_fk),
        "brand_id_fk": ObjectId(body.brand_id_fk),
        "createdAt": now,
        "updatedAt": now,
    }
    result = db.parfums.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_doc(doc)


@router.put("/api/parfum/{id}")
def update_parfum(id: str, body: ParfumBody, _: dict = Depends(verify_token)):
    db = get_db()
    from bson import ObjectId
    from datetime import datetime, timezone
    update = {
        "$set": {
            "title": body.title,
            "description": body.description,
            "gender": body.gender,
            "status": body.status,
            "version_id_fk": ObjectId(body.version_id_fk),
            "brand_id_fk": ObjectId(body.brand_id_fk),
            "updatedAt": datetime.now(timezone.utc),
        }
    }
    doc = db.parfums.find_one_and_update({"_id": to_object_id(id)}, update, return_document=True)
    if not doc:
        return JSONResponse(status_code=404, content={"message": "Parfum not Found"})
    return serialize_doc(doc)


@router.delete("/api/parfum/{id}")
def delete_parfum(id: str, _: dict = Depends(verify_token)):
    db = get_db()
    oid = to_object_id(id)
    if db.bodies.count_documents({"parfum_id_fk": oid}) > 0:
        return JSONResponse(status_code=202, content={"message": "Este Parfum está siendo usado en Fondos de Inicio, no se puede eliminar."})
    if db.types.count_documents({"parfum_id_fk": oid}) > 0:
        return JSONResponse(status_code=202, content={"message": "Este Parfum está siendo usado en Tipos de Perfumes, no se puede eliminar."})
    doc = db.parfums.find_one_and_delete({"_id": oid})
    if not doc:
        return JSONResponse(status_code=404, content={"message": "Parfum not Found"})
    return serialize_doc(doc)
