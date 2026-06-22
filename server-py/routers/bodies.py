from typing import Optional
from fastapi import APIRouter, Depends, Query, UploadFile, File, Form
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from bson import ObjectId

from database import get_db
from auth import verify_token
from helpers import serialize_doc, paginate_cursor, to_object_id
from storage import upload_file

router = APIRouter()


class FilterBody(BaseModel):
    filter: str = ""


def _with_parfum(doc: dict, db) -> dict:
    s = serialize_doc(doc)
    if s and doc.get("parfum_id_fk"):
        parfum = db.parfums.find_one({"_id": doc["parfum_id_fk"]}, {"title": 1})
        s["parfum_id_fk"] = {"_id": str(parfum["_id"]), "title": parfum["title"]} if parfum else None
    return s


@router.get("/api/bodies/all")
def get_all_bodies(_: dict = Depends(verify_token)):
    db = get_db()
    docs = list(db.bodies.find())
    return [_with_parfum(d, db) for d in docs]


@router.get("/api/bodies")
def get_bodies(_: dict = Depends(verify_token), page: int = Query(default=1)):
    db = get_db()
    query = {}
    cursor = db.bodies.find(query)
    result = paginate_cursor(cursor, db.bodies, query, page)
    result["data"] = [_with_parfum(db.bodies.find_one({"_id": to_object_id(d["_id"])}), db) for d in result["data"]]
    return result


@router.post("/api/bodies/filtered")
def get_filtered_bodies(body: FilterBody, _: dict = Depends(verify_token), page: int = Query(default=1)):
    db = get_db()
    f = body.filter
    status_filter = None
    if f and "activado".startswith(f.lower()):
        status_filter = 1
    elif f and "desactivado".startswith(f.lower()):
        status_filter = 0

    query = {}
    if f:
        or_clauses = [
            {"title": {"$regex": f, "$options": "i"}},
            {"align": {"$regex": f, "$options": "i"}},
            {"url": {"$regex": f, "$options": "i"}},
            {"color": {"$regex": f, "$options": "i"}},
            {"color2": {"$regex": f, "$options": "i"}},
        ]
        if status_filter is not None:
            or_clauses.append({"status": status_filter})
        query = {"$or": or_clauses}

    cursor = db.bodies.find(query)
    result = paginate_cursor(cursor, db.bodies, query, page)
    result["data"] = [_with_parfum(db.bodies.find_one({"_id": to_object_id(d["_id"])}), db) for d in result["data"]]
    return result


@router.get("/api/body")
def get_body(_: dict = Depends(verify_token), id: str = Query(default=None)):
    if not id:
        return JSONResponse(status_code=404, content={"message": "Body not Found"})
    db = get_db()
    doc = db.bodies.find_one({"_id": to_object_id(id)})
    if not doc:
        return JSONResponse(status_code=404, content={"message": "Body not Found"})
    return serialize_doc(doc)


@router.post("/api/body")
async def create_body(
    _: dict = Depends(verify_token),
    title: str = Form(...),
    align: str = Form(...),
    url: Optional[str] = Form(default=None),
    color: str = Form(...),
    color2: str = Form(...),
    status: int = Form(...),
    parfum_id_fk: str = Form(...),
    img1: Optional[UploadFile] = File(default=None),
    img2: Optional[UploadFile] = File(default=None),
):
    db = get_db()
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)

    parfum_img = None
    if img1 and img1.filename:
        content = await img1.read()
        parfum_img = upload_file(content, img1.filename, "body")

    back_img = None
    if img2 and img2.filename:
        content = await img2.read()
        back_img = upload_file(content, img2.filename, "body")

    doc = {
        "title": title, "align": align, "url": url,
        "parfum_img": parfum_img, "back_img": back_img,
        "color": color, "color2": color2, "status": status,
        "parfum_id_fk": ObjectId(parfum_id_fk),
        "createdAt": now, "updatedAt": now,
    }
    result = db.bodies.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_doc(doc)


@router.put("/api/body/{id}")
async def update_body(
    id: str,
    _: dict = Depends(verify_token),
    title: str = Form(...),
    align: str = Form(...),
    url: Optional[str] = Form(default=None),
    color: str = Form(...),
    color2: str = Form(...),
    status: int = Form(...),
    parfum_id_fk: str = Form(...),
    img1: Optional[UploadFile] = File(default=None),
    img2: Optional[UploadFile] = File(default=None),
):
    db = get_db()
    from datetime import datetime, timezone
    update_data = {
        "title": title, "align": align, "url": url,
        "color": color, "color2": color2, "status": status,
        "parfum_id_fk": ObjectId(parfum_id_fk),
        "updatedAt": datetime.now(timezone.utc),
    }

    if img1 and img1.filename:
        content = await img1.read()
        update_data["parfum_img"] = upload_file(content, img1.filename, "body")
    if img2 and img2.filename:
        content = await img2.read()
        update_data["back_img"] = upload_file(content, img2.filename, "body")

    doc = db.bodies.find_one_and_update(
        {"_id": to_object_id(id)}, {"$set": update_data}, return_document=True
    )
    if not doc:
        return JSONResponse(status_code=404, content={"message": "Body not Found"})
    return serialize_doc(doc)


@router.delete("/api/body/{id}")
def delete_body(id: str, _: dict = Depends(verify_token)):
    db = get_db()
    doc = db.bodies.find_one_and_delete({"_id": to_object_id(id)})
    if not doc:
        return JSONResponse(status_code=404, content={"message": "Body not Found"})
    return serialize_doc(doc)
