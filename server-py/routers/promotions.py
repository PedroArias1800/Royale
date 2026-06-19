from typing import Optional
from fastapi import APIRouter, Depends, Query, UploadFile, File, Form
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from database import get_db
from auth import verify_token
from helpers import serialize_doc, paginate_cursor, to_object_id
from storage import upload_file

router = APIRouter()


class FilterBody(BaseModel):
    filter: str = ""


@router.get("/api/promotions/all")
def get_all_promotions(_: dict = Depends(verify_token)):
    db = get_db()
    return [serialize_doc(d) for d in db.promotions.find().sort("title", 1)]


@router.get("/api/promotions")
def get_promotions(_: dict = Depends(verify_token), page: int = Query(default=1)):
    db = get_db()
    query = {}
    cursor = db.promotions.find(query).sort("title", 1)
    return paginate_cursor(cursor, db.promotions, query, page)


@router.post("/api/promotions/filtered")
def get_filtered_promotions(body: FilterBody, _: dict = Depends(verify_token), page: int = Query(default=1)):
    db = get_db()
    f = body.filter
    query = {"$or": [{"title": {"$regex": f, "$options": "i"}}]} if f else {}
    cursor = db.promotions.find(query).sort("title", 1)
    return paginate_cursor(cursor, db.promotions, query, page)


@router.get("/api/promotion")
def get_promotion(_: dict = Depends(verify_token), id: str = Query(default=None)):
    if not id:
        return JSONResponse(status_code=404, content={"message": "Promotion not Found"})
    db = get_db()
    doc = db.promotions.find_one({"_id": to_object_id(id)})
    if not doc:
        return JSONResponse(status_code=404, content={"message": "Promotion not Found"})
    return serialize_doc(doc)


@router.post("/api/promotion")
async def create_promotion(
    _: dict = Depends(verify_token),
    title: str = Form(...),
    status: int = Form(...),
    mediaServer: Optional[str] = Form(default=None),
    media: Optional[UploadFile] = File(default=None),
):
    db = get_db()
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)

    media_url = None
    if media and media.filename:
        content = await media.read()
        media_url = upload_file(content, media.filename, "promotion")
    elif mediaServer:
        media_url = mediaServer

    doc = {"title": title, "media": media_url, "status": status, "createdAt": now, "updatedAt": now}
    result = db.promotions.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_doc(doc)


@router.put("/api/promotion/{id}")
async def update_promotion(
    id: str,
    _: dict = Depends(verify_token),
    title: str = Form(...),
    status: int = Form(...),
    mediaServer: Optional[str] = Form(default=None),
    media: Optional[UploadFile] = File(default=None),
):
    db = get_db()
    from datetime import datetime, timezone
    update_data = {"title": title, "status": status, "updatedAt": datetime.now(timezone.utc)}

    if media and media.filename:
        content = await media.read()
        update_data["media"] = upload_file(content, media.filename, "promotion")
    elif mediaServer:
        update_data["media"] = mediaServer

    doc = db.promotions.find_one_and_update(
        {"_id": to_object_id(id)}, {"$set": update_data}, return_document=True
    )
    if not doc:
        return JSONResponse(status_code=404, content={"message": "Promotion not Found"})
    return serialize_doc(doc)


@router.delete("/api/promotion/{id}")
def delete_promotion(id: str, _: dict = Depends(verify_token)):
    db = get_db()
    doc = db.promotions.find_one_and_delete({"_id": to_object_id(id)})
    if not doc:
        return JSONResponse(status_code=404, content={"message": "Promotion not Found"})
    return serialize_doc(doc)
