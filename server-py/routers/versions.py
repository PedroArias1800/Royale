from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from database import get_db
from auth import verify_token
from helpers import serialize_doc, paginate_cursor, to_object_id

router = APIRouter()


class VersionBody(BaseModel):
    version_name: str
    description: str = ""


class FilterBody(BaseModel):
    filter: str = ""


@router.get("/api/versions/all")
def get_all_versions(_: dict = Depends(verify_token)):
    db = get_db()
    return [serialize_doc(d) for d in db.versions.find().sort("version_name", 1)]


@router.get("/api/versions")
def get_versions(_: dict = Depends(verify_token), page: int = Query(default=1)):
    db = get_db()
    query = {}
    cursor = db.versions.find(query).sort("version_name", 1)
    return paginate_cursor(cursor, db.versions, query, page)


@router.post("/api/versions/filtered")
def get_filtered_versions(body: FilterBody, _: dict = Depends(verify_token), page: int = Query(default=1)):
    db = get_db()
    f = body.filter
    query = {"$or": [
        {"version_name": {"$regex": f, "$options": "i"}},
        {"description": {"$regex": f, "$options": "i"}},
    ]} if f else {}
    cursor = db.versions.find(query).sort("version_name", 1)
    return paginate_cursor(cursor, db.versions, query, page)


@router.get("/api/version")
def get_version(_: dict = Depends(verify_token), id: str = Query(default=None)):
    if not id:
        return JSONResponse(status_code=404, content={"message": "Version not Found"})
    db = get_db()
    doc = db.versions.find_one({"_id": to_object_id(id)})
    if not doc:
        return JSONResponse(status_code=404, content={"message": "Version not Found"})
    return serialize_doc(doc)


@router.post("/api/version")
def create_version(body: VersionBody, _: dict = Depends(verify_token)):
    db = get_db()
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    doc = {"version_name": body.version_name, "description": body.description, "createdAt": now, "updatedAt": now}
    result = db.versions.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_doc(doc)


@router.put("/api/version/{id}")
def update_version(id: str, body: VersionBody, _: dict = Depends(verify_token)):
    db = get_db()
    from datetime import datetime, timezone
    doc = db.versions.find_one_and_update(
        {"_id": to_object_id(id)},
        {"$set": {"version_name": body.version_name, "description": body.description, "updatedAt": datetime.now(timezone.utc)}},
        return_document=True,
    )
    if not doc:
        return JSONResponse(status_code=404, content={"message": "Version not Found"})
    return serialize_doc(doc)


@router.delete("/api/version/{id}")
def delete_version(id: str, _: dict = Depends(verify_token)):
    db = get_db()
    oid = to_object_id(id)
    if db.parfums.count_documents({"version_id_fk": oid}) > 0:
        return JSONResponse(status_code=202, content={"message": "Esta Versión está siendo usado en Perfumes, no se puede eliminar."})
    doc = db.versions.find_one_and_delete({"_id": oid})
    if not doc:
        return JSONResponse(status_code=404, content={"message": "Version not Found"})
    return serialize_doc(doc)
