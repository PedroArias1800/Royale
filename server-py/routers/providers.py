from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from database import get_db
from auth import verify_token
from helpers import serialize_doc, paginate_cursor, to_object_id

router = APIRouter()


class ProviderBody(BaseModel):
    provider_name: str


class FilterBody(BaseModel):
    filter: str = ""


@router.get("/api/providers/all")
def get_all_providers(_: dict = Depends(verify_token)):
    db = get_db()
    return [serialize_doc(d) for d in db.providers.find().sort("provider_name", 1)]


@router.get("/api/providers")
def get_providers(_: dict = Depends(verify_token), page: int = Query(default=1)):
    db = get_db()
    query = {}
    cursor = db.providers.find(query).sort("provider_name", 1)
    return paginate_cursor(cursor, db.providers, query, page)


@router.post("/api/providers/filtered")
def get_filtered_providers(body: FilterBody, _: dict = Depends(verify_token), page: int = Query(default=1)):
    db = get_db()
    f = body.filter
    query = {"$or": [{"provider_name": {"$regex": f, "$options": "i"}}]} if f else {}
    cursor = db.providers.find(query).sort("provider_name", 1)
    return paginate_cursor(cursor, db.providers, query, page)


@router.get("/api/provider")
def get_provider(_: dict = Depends(verify_token), id: str = Query(default=None)):
    if not id:
        return JSONResponse(status_code=404, content={"message": "Provider not Found"})
    db = get_db()
    doc = db.providers.find_one({"_id": to_object_id(id)})
    if not doc:
        return JSONResponse(status_code=404, content={"message": "Provider not Found"})
    return serialize_doc(doc)


@router.post("/api/provider")
def create_provider(body: ProviderBody, _: dict = Depends(verify_token)):
    db = get_db()
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    doc = {"provider_name": body.provider_name.strip(), "createdAt": now, "updatedAt": now}
    result = db.providers.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_doc(doc)


@router.put("/api/provider/{id}")
def update_provider(id: str, body: ProviderBody, _: dict = Depends(verify_token)):
    db = get_db()
    from datetime import datetime, timezone
    doc = db.providers.find_one_and_update(
        {"_id": to_object_id(id)},
        {"$set": {"provider_name": body.provider_name.strip(), "updatedAt": datetime.now(timezone.utc)}},
        return_document=True,
    )
    if not doc:
        return JSONResponse(status_code=404, content={"message": "Provider not Found"})
    return serialize_doc(doc)


@router.delete("/api/provider/{id}")
def delete_provider(id: str, _: dict = Depends(verify_token)):
    db = get_db()
    oid = to_object_id(id)
    if db.parfums.count_documents({"provider_id_fk": oid}) > 0:
        return JSONResponse(status_code=202, content={"message": "Este Proveedor está siendo usado en Perfumes, no se puede eliminar."})
    doc = db.providers.find_one_and_delete({"_id": oid})
    if not doc:
        return JSONResponse(status_code=404, content={"message": "Provider not Found"})
    return serialize_doc(doc)
