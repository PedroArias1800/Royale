from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional

from database import get_db
from auth import verify_token
from helpers import serialize_doc, to_object_id

router = APIRouter()

LABELS_INGRESO = [
    "Venta Directa",
    "Abono",
    "Devolución recibida",
    "Otro ingreso",
]

LABELS_SALIDA = [
    "Costo del Producto",
    "Gastos Operativos",
    "Merma",
    "Publicidad y Marketing",
    "Envíos y Logística",
    "Devolución emitida",
    "Otro gasto",
]


class MovementBody(BaseModel):
    type: str          # "ingreso" | "salida"
    label: str
    amount: float
    description: Optional[str] = ""
    date: Optional[str] = None  # ISO date string; defaults to now


@router.post("/api/movements")
def create_movement(body: MovementBody, db=Depends(get_db), _=Depends(verify_token)):
    now = datetime.now(timezone.utc)
    movement_date = datetime.fromisoformat(body.date) if body.date else now
    doc = {
        "type": body.type,
        "label": body.label,
        "amount": body.amount,
        "description": body.description or "",
        "date": movement_date,
        "createdAt": now,
        "updatedAt": now,
    }
    result = db.movements.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_doc(doc)


@router.get("/api/movements")
def list_movements(
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    db=Depends(get_db),
    _=Depends(verify_token),
):
    query: dict = {}
    date_filter: dict = {}
    if start:
        date_filter["$gte"] = datetime.fromisoformat(start)
    if end:
        date_filter["$lte"] = datetime.fromisoformat(end)
    if date_filter:
        query["date"] = date_filter
    if type in ("ingreso", "salida"):
        query["type"] = type

    docs = [serialize_doc(d) for d in db.movements.find(query).sort("date", -1)]
    return docs


@router.put("/api/movements/{movement_id}")
def update_movement(movement_id: str, body: MovementBody, db=Depends(get_db), _=Depends(verify_token)):
    oid = to_object_id(movement_id)
    now = datetime.now(timezone.utc)
    update: dict = {
        "$set": {
            "type": body.type,
            "label": body.label,
            "amount": body.amount,
            "description": body.description or "",
            "updatedAt": now,
        }
    }
    if body.date:
        update["$set"]["date"] = datetime.fromisoformat(body.date)

    result = db.movements.update_one({"_id": oid}, update)
    if result.matched_count == 0:
        return JSONResponse(status_code=404, content={"message": "Movimiento no encontrado"})

    doc = db.movements.find_one({"_id": oid})
    return serialize_doc(doc)


@router.delete("/api/movements/{movement_id}")
def delete_movement(movement_id: str, db=Depends(get_db), _=Depends(verify_token)):
    oid = to_object_id(movement_id)
    result = db.movements.delete_one({"_id": oid})
    if result.deleted_count == 0:
        return JSONResponse(status_code=404, content={"message": "Movimiento no encontrado"})
    return {"message": "Movimiento eliminado"}


@router.get("/api/movements/labels")
def get_labels(_=Depends(verify_token)):
    return {"ingreso": LABELS_INGRESO, "salida": LABELS_SALIDA}
