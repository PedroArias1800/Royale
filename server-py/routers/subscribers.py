from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

from database import get_db
from auth import verify_token
from helpers import serialize_doc, to_object_id

router = APIRouter()


@router.get("/api/subscribers")
def get_subscribers(_: dict = Depends(verify_token)):
    db = get_db()
    docs = list(db.subscribers.find().sort("createdAt", -1))
    return [serialize_doc(d) for d in docs]


@router.delete("/api/subscribers/{id}")
def delete_subscriber(id: str, _: dict = Depends(verify_token)):
    db = get_db()
    oid = to_object_id(id)
    result = db.subscribers.delete_one({"_id": oid})
    if result.deleted_count == 0:
        return JSONResponse(status_code=404, content={"message": "Suscriptor no encontrado"})
    return {"success": True}
