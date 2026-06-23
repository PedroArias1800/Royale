import math
import os
import io
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel
from typing import Optional, List
from bson import ObjectId

from database import get_db
from auth import verify_token
from helpers import serialize_doc, to_object_id

router = APIRouter()


class FilterBody(BaseModel):
    filter: str = ""


LABELS_INGRESO = ["Venta Directa", "Abono", "Devolución recibida", "Otro ingreso"]
LABELS_SALIDA = ["Costo del Producto", "Gastos Operativos", "Merma", "Publicidad y Marketing", "Envíos y Logística", "Devolución emitida", "Otro gasto"]


class TransactionUpdateBody(BaseModel):
    payment_method: Optional[str] = None
    delivery_method: Optional[str] = None
    channel: Optional[str] = None
    label: Optional[str] = None
    description: Optional[str] = None
    fin_type: Optional[str] = None
    status: Optional[int] = None
    omitted: Optional[bool] = None         # True = excluir de estadísticas


class TransactionManualBody(BaseModel):
    fin_type: str                           # ingreso | salida
    label: str
    total: float
    subTotal: Optional[float] = None
    description: Optional[str] = ""
    userName: Optional[str] = "Admin"
    phone: Optional[str] = ""
    direction: Optional[str] = ""
    email: Optional[str] = ""
    payment_method: Optional[str] = ""
    delivery_method: Optional[str] = ""
    channel: Optional[str] = ""
    products: Optional[List[str]] = []
    quantities: Optional[List[int]] = []


def _populate_transaction(doc: dict, db, include_products: bool = False) -> dict:
    s = serialize_doc(doc)
    if not s:
        return s

    # seller
    if doc.get("seller_id_fk"):
        user = db.users.find_one({"_id": doc["seller_id_fk"]}, {"firstname": 1, "lastname": 1})
        s["seller"] = f"{user['firstname']} {user['lastname']}" if user else "Sitio Web"
        s["seller_id_fk"] = str(doc["seller_id_fk"])
    else:
        s["seller"] = "Sitio Web"

    # productsTypes → resolve to ml strings
    if doc.get("productsTypes"):
        type_ids = []
        for pt in doc["productsTypes"]:
            try:
                type_ids.append(ObjectId(pt))
            except Exception:
                pass
        types = {str(t["_id"]): t["ml"] for t in db.types.find({"_id": {"$in": type_ids}}, {"ml": 1})}
        s["productsTypes"] = [types.get(pt, pt) for pt in s.get("productsTypes", [])]

    # products → resolve to "id=brand title" strings (for filtered) or just ml
    if include_products and doc.get("products"):
        product_ids = []
        for p in doc["products"]:
            try:
                pid = p.split("=")[0] if "=" in p else p
                product_ids.append(ObjectId(pid))
            except Exception:
                pass
        parfums = list(db.parfums.find({"_id": {"$in": product_ids}}, {"title": 1, "brand_id_fk": 1}))
        brand_ids = [p["brand_id_fk"] for p in parfums if p.get("brand_id_fk")]
        brands = {str(b["_id"]): b["brand_name"] for b in db.brands.find({"_id": {"$in": brand_ids}}, {"brand_name": 1})}
        s["products"] = [
            f"{str(p['_id'])}={brands.get(str(p.get('brand_id_fk', '')), '')} {p['title']}"
            for p in parfums
        ]

    return s


@router.get("/api/transaction/all")
def get_all_transactions(_: dict = Depends(verify_token), page: int = Query(default=1)):
    db = get_db()
    limit = 15
    skip = (page - 1) * limit
    docs = list(db.transactions.find().sort("createdAt", -1).skip(skip).limit(limit))
    total = db.transactions.count_documents({})
    data = [_populate_transaction(d, db) for d in docs]
    return {
        "data": data,
        "pagination": {
            "currentPage": page,
            "totalPages": math.ceil(total / limit),
            "totalItems": total,
            "itemsPerPage": limit,
        },
    }


@router.post("/api/transactions/filtered")
def get_filtered_transactions(body: FilterBody, _: dict = Depends(verify_token), page: int = Query(default=1)):
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
            {"userName": {"$regex": f, "$options": "i"}},
            {"phone": {"$regex": f, "$options": "i"}},
            {"direction": {"$regex": f, "$options": "i"}},
            {"email": {"$regex": f, "$options": "i"}},
            {"label": {"$regex": f, "$options": "i"}},
            {"description": {"$regex": f, "$options": "i"}},
            {"payment_method": {"$regex": f, "$options": "i"}},
            {"delivery_method": {"$regex": f, "$options": "i"}},
            {"channel": {"$regex": f, "$options": "i"}},
            {"fin_type": {"$regex": f, "$options": "i"}},
        ]
        if status_filter is not None:
            or_clauses.append({"status": bool(status_filter)})
        query = {"$or": or_clauses}

    docs = list(db.transactions.find(query).sort("createdAt", -1).skip(skip).limit(limit))
    total = db.transactions.count_documents(query)
    data = [_populate_transaction(d, db, include_products=True) for d in docs]
    return {
        "data": data,
        "pagination": {
            "currentPage": page,
            "totalPages": math.ceil(total / limit),
            "totalItems": total,
            "itemsPerPage": limit,
        },
    }


@router.get("/api/transactions/all/{id}")
def get_transactions_by_user(id: str, page: int = Query(default=1)):
    db = get_db()
    oid = to_object_id(id)
    user = db.users.find_one({"_id": oid}, {"firstname": 1, "lastname": 1})
    if not user:
        return JSONResponse(status_code=404, content={"message": "Usuario no encontrado"})

    limit = 15
    skip = (page - 1) * limit
    docs = list(db.transactions.find({"seller_id_fk": oid}).sort("createdAt", -1).skip(skip).limit(limit))
    total = db.transactions.count_documents({"seller_id_fk": oid})

    data = []
    for doc in docs:
        s = serialize_doc(doc)
        s["seller"] = f"{user['firstname']} {user['lastname']}"
        # resolve productsTypes
        if doc.get("productsTypes"):
            type_ids = [ObjectId(pt) for pt in doc["productsTypes"] if len(pt) == 24]
            types = {str(t["_id"]): t["ml"] for t in db.types.find({"_id": {"$in": type_ids}}, {"ml": 1})}
            s["productsTypes"] = [types.get(pt, pt) for pt in s.get("productsTypes", [])]
        data.append(s)

    return {
        "data": data,
        "pagination": {
            "currentPage": page,
            "totalPages": math.ceil(total / limit),
            "totalItems": total,
            "itemsPerPage": limit,
        },
    }


@router.get("/api/transactions/monthly/{id}")
def get_monthly_count_by_user(id: str):
    db = get_db()
    from datetime import datetime, timezone
    oid = to_object_id(id)
    user = db.users.find_one({"_id": oid}, {"firstname": 1, "lastname": 1})
    if not user:
        return JSONResponse(status_code=404, content={"message": "Usuario no encontrado"})

    now = datetime.now(timezone.utc)
    first_day = datetime(now.year, now.month, 1, tzinfo=timezone.utc)
    last_month = now.month % 12 + 1
    last_year = now.year + (1 if now.month == 12 else 0)
    last_day = datetime(last_year, last_month, 1, tzinfo=timezone.utc)

    transactions = list(db.transactions.find(
        {"seller_id_fk": oid, "createdAt": {"$gte": first_day, "$lt": last_day}},
        {"quantities": 1}
    ))
    total_quantities = sum(sum(t.get("quantities", [])) for t in transactions)
    return {
        "seller": f"{user['firstname']} {user['lastname']}",
        "totalQuantitiesThisMonth": total_quantities,
    }


@router.get("/api/transactions/pending")
def get_pending_transactions(_: dict = Depends(verify_token), page: int = Query(default=1)):
    db = get_db()
    limit = 15
    skip = (page - 1) * limit
    query = {"status": {"$in": [False, 1]}, "is_manual": {"$ne": True}}
    docs = list(db.transactions.find(query).sort("createdAt", -1).skip(skip).limit(limit))
    total = db.transactions.count_documents(query)
    data = [_populate_transaction(d, db, include_products=True) for d in docs]
    return {
        "data": data,
        "pagination": {
            "currentPage": page,
            "totalPages": math.ceil(total / limit) if total else 1,
            "totalItems": total,
            "itemsPerPage": limit,
        },
    }


@router.get("/api/transactions/processed")
def get_processed_transactions(
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None),
    _: dict = Depends(verify_token),
):
    db = get_db()
    query: dict = {"status": 2, "is_manual": {"$ne": True}}
    date_filter: dict = {}
    if start:
        date_filter["$gte"] = datetime.fromisoformat(start).replace(tzinfo=timezone.utc)
    if end:
        date_filter["$lte"] = datetime.fromisoformat(end).replace(tzinfo=timezone.utc)
    if date_filter:
        query["updatedAt"] = date_filter
    docs = list(db.transactions.find(query).sort("updatedAt", -1))
    return [_populate_transaction(d, db, include_products=True) for d in docs]


@router.get("/api/transactions/manual")
def get_manual_transactions(
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None),
    _: dict = Depends(verify_token),
):
    db = get_db()
    query: dict = {"is_manual": True}
    date_filter: dict = {}
    if start:
        date_filter["$gte"] = datetime.fromisoformat(start).replace(tzinfo=timezone.utc)
    if end:
        date_filter["$lte"] = datetime.fromisoformat(end).replace(tzinfo=timezone.utc)
    if date_filter:
        query["createdAt"] = date_filter
    docs = list(db.transactions.find(query).sort("createdAt", -1))
    return [serialize_doc(d) for d in docs]


@router.post("/api/transactions/manual")
def create_manual_transaction(body: TransactionManualBody, db=Depends(get_db), _=Depends(verify_token)):
    now = datetime.now(timezone.utc)
    doc = {
        "fin_type": body.fin_type,
        "label": body.label,
        "total": body.total,
        "subTotal": body.subTotal if body.subTotal is not None else body.total,
        "description": body.description or "",
        "userName": body.userName or "",
        "phone": body.phone or "",
        "direction": body.direction or "",
        "email": body.email or "",
        "payment_method": body.payment_method or "",
        "delivery_method": body.delivery_method or "",
        "channel": body.channel or "",
        "products": body.products or [],
        "productsTypes": [],
        "quantities": body.quantities or [],
        "status": 2,
        "is_manual": True,
        "createdAt": now,
        "updatedAt": now,
    }
    result = db.transactions.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_doc(doc)


@router.put("/api/transactions/{transaction_id}")
def update_transaction(transaction_id: str, body: TransactionUpdateBody, db=Depends(get_db), _=Depends(verify_token)):
    oid = to_object_id(transaction_id)
    updates: dict = {"updatedAt": datetime.now(timezone.utc)}
    for field in ("payment_method", "delivery_method", "channel", "label", "description", "fin_type"):
        val = getattr(body, field)
        if val is not None:
            updates[field] = val
    if body.status is not None:
        updates["status"] = body.status
    if body.omitted is not None:
        updates["omitted"] = body.omitted

    result = db.transactions.update_one({"_id": oid}, {"$set": updates})
    if result.matched_count == 0:
        return JSONResponse(status_code=404, content={"message": "Transacción no encontrada"})

    doc = db.transactions.find_one({"_id": oid})
    return _populate_transaction(doc, db, include_products=True)


@router.delete("/api/transactions/{transaction_id}")
def delete_manual_transaction(transaction_id: str, db=Depends(get_db), _=Depends(verify_token)):
    oid = to_object_id(transaction_id)
    doc = db.transactions.find_one({"_id": oid})
    if not doc:
        return JSONResponse(status_code=404, content={"message": "Transacción no encontrada"})
    if not doc.get("is_manual"):
        return JSONResponse(status_code=403, content={"message": "Solo se pueden eliminar transacciones manuales"})
    db.transactions.delete_one({"_id": oid})
    return {"message": "Eliminada"}


@router.get("/api/transactions/export")
def export_transactions():
    import openpyxl
    db = get_db()
    docs = list(db.transactions.find().sort("title", 1))

    for doc in docs:
        if doc.get("products"):
            product_ids = []
            for p in doc["products"]:
                try:
                    pid = p.split("=")[0] if "=" in p else p
                    product_ids.append(ObjectId(pid))
                except Exception:
                    pass
            parfums = {str(p["_id"]): p["title"] for p in db.parfums.find({"_id": {"$in": product_ids}}, {"title": 1})}
            doc["_products_resolved"] = [parfums.get(p.split("=")[0] if "=" in p else p, p) for p in doc["products"]]

        if doc.get("productsTypes"):
            type_ids = [ObjectId(pt) for pt in doc["productsTypes"] if len(pt) == 24]
            types = {str(t["_id"]): t["ml"] for t in db.types.find({"_id": {"$in": type_ids}}, {"ml": 1})}
            doc["_types_resolved"] = [types.get(pt, pt) for pt in doc["productsTypes"]]

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Transacciones"
    ws.append(["Cliente", "Teléfono", "Dirección", "Correo", "SubTotal", "Total",
                "Estado", "Productos", "Tipos de Productos", "Cantidades", "Creado el", "Actualizado el"])

    for doc in docs:
        ws.append([
            doc.get("userName", ""),
            doc.get("phone", ""),
            doc.get("direction", ""),
            doc.get("email", ""),
            doc.get("subTotal", 0),
            doc.get("total", 0),
            "Atendido" if doc.get("status") else "Por Atender",
            ", ".join(doc.get("_products_resolved", doc.get("products", []))),
            ", ".join(doc.get("_types_resolved", doc.get("productsTypes", []))),
            ", ".join(str(q) for q in doc.get("quantities", [])),
            doc.get("createdAt", "").isoformat() if doc.get("createdAt") else "",
            doc.get("updatedAt", "").isoformat() if doc.get("updatedAt") else "",
        ])

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=Royale-Transacciones.xlsx"},
    )
