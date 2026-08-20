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
from helpers import serialize_doc, to_object_id, generate_order_number, mark_coupon_used

router = APIRouter()


class FilterBody(BaseModel):
    filter: str = ""
    fin_type: Optional[str] = None
    order_number: Optional[str] = None
    stage: Optional[str] = None   # pending|en-camino|finalizadas|canceladas|cuentas-pendientes|cuentas-cerradas


LABELS_INGRESO = ["Venta Directa", "Abono", "Devolución recibida", "Otro ingreso"]
LABELS_SALIDA = ["Costo del Producto", "Gastos Operativos", "Merma", "Publicidad y Marketing", "Envíos y Logística", "Devolución emitida", "Pago de Corte", "Otro gasto"]


class OperationalCostItem(BaseModel):
    amount: float
    type_key: str
    type_label: str
    responsible_id: Optional[str] = None   # ObjectId del usuario interno; None = externo
    responsible_name: str                   # nombre del usuario o del servicio externo


class TransactionUpdateBody(BaseModel):
    payment_method: Optional[str] = None
    delivery_method: Optional[str] = None
    channel: Optional[str] = None
    label: Optional[str] = None
    description: Optional[str] = None
    fin_type: Optional[str] = None
    status: Optional[int] = None
    omitted: Optional[bool] = None         # True = excluir de estadísticas
    operational_cost: Optional[float] = None
    operational_costs: Optional[List[OperationalCostItem]] = None  # lista estructurada
    products_cost: Optional[float] = None
    products_prices: Optional[List[float]] = None
    total: Optional[float] = None
    seller_id_fk: Optional[str] = None
    lot_numbers: Optional[List[str]] = None
    delivery_date: Optional[str] = None
    delivery_assigned_to: Optional[str] = None
    delivery_assigned_name: Optional[str] = None
    provider_id_fk: Optional[str] = None
    coupon_id: Optional[str] = None
    coupon_discount: Optional[float] = None
    yappy_fee: Optional[float] = None
    delivery_label: Optional[str] = None
    direction: Optional[str] = None
    delivered_by: Optional[str] = None
    delivered_at: Optional[str] = None
    delivery_note: Optional[str] = None


class AccountTransactionBody(BaseModel):
    fin_type: str                           # 'ingreso' | 'salida'
    label: str                              # 'Cuenta por Cobrar' | 'Cuenta por Pagar'
    total: float
    entity_name: str
    entity_user_id: Optional[str] = None
    description: Optional[str] = ""
    products: Optional[List[str]] = []
    quantities: Optional[List[int]] = []
    products_prices: Optional[List[float]] = []
    created_by: Optional[str] = None
    created_at: Optional[str] = None
    next_payment_date: Optional[str] = None


class RegisterPaymentBody(BaseModel):
    amount: float
    note: Optional[str] = ""
    registered_by: Optional[str] = None
    next_payment_date: Optional[str] = None


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
    delivery_fee: Optional[float] = 0.0
    delivery_label: Optional[str] = ""
    channel: Optional[str] = ""
    products: Optional[List[str]] = []
    productsTypes: Optional[List[str]] = []
    quantities: Optional[List[int]] = []
    seller_id_fk: Optional[str] = None
    status: Optional[int] = 2              # 1=pendiente, 2=procesada
    created_at: Optional[str] = None       # ISO date override (YYYY-MM-DD)
    lot_numbers: Optional[List[str]] = []
    delivery_date: Optional[str] = None    # YYYY-MM-DD para aparecer en Consolidación
    operational_costs: Optional[List[OperationalCostItem]] = []
    coupon_id: Optional[str] = None
    coupon_discount: Optional[float] = 0.0
    yappy_fee: Optional[float] = 0.0
    products_cost: Optional[float] = None
    products_prices: Optional[List[float]] = []
    provider_id_fk: Optional[str] = None
    express_delivery: Optional[bool] = False


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
    query = {"status": {"$ne": 0}}
    docs = list(db.transactions.find(query).sort("createdAt", -1).skip(skip).limit(limit))
    total = db.transactions.count_documents(query)
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


@router.post("/api/transactions/account")
def create_account_transaction(body: AccountTransactionBody, user: dict = Depends(verify_token)):
    from datetime import datetime, timezone
    db = get_db()
    now = datetime.now(timezone.utc)

    created_at = now
    if body.created_at:
        try:
            created_at = datetime.fromisoformat(body.created_at)
            if created_at.tzinfo is None:
                created_at = created_at.replace(tzinfo=timezone.utc)
        except Exception:
            pass

    order_number = generate_order_number(db)
    doc = {
        "order_number":    order_number,
        "fin_type":        body.fin_type,
        "label":           body.label,
        "status":          3,
        "is_account":      True,
        "is_manual":       True,
        "entity_name":     body.entity_name,
        "entity_user_id":  to_object_id(body.entity_user_id) if body.entity_user_id else None,
        "total":           body.total,
        "amount_paid":     0.0,
        "description":     body.description or "",
        "products":          body.products or [],
        "quantities":        body.quantities or [],
        "products_prices":   body.products_prices or [],
        "payment_history":   [],
        "next_payment_date": body.next_payment_date or None,
        "createdAt":         created_at,
        "created_by":        body.created_by or user.get("id"),
        "omitted":           False,
        "active":            True,
    }
    result = db.transactions.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_doc(doc)


@router.get("/api/transactions/accounts")
def get_account_transactions(_: dict = Depends(verify_token)):
    db = get_db()
    docs = list(db.transactions.find(
        {"is_account": True},
    ).sort("createdAt", -1))
    out = []
    for doc in docs:
        s = serialize_doc(doc)
        # resolve entity user name if linked
        if doc.get("entity_user_id"):
            u = db.users.find_one({"_id": doc["entity_user_id"]}, {"firstname": 1, "lastname": 1})
            if u:
                s["entity_display"] = f"{u['firstname']} {u['lastname']}"
        out.append(s)
    return out


@router.post("/api/transactions/{tx_id}/payment")
def register_account_payment(tx_id: str, body: RegisterPaymentBody, user: dict = Depends(verify_token)):
    from datetime import datetime, timezone
    db = get_db()
    oid = to_object_id(tx_id)
    tx = db.transactions.find_one({"_id": oid})
    if not tx:
        return JSONResponse(status_code=404, content={"message": "Transacción no encontrada"})
    if not tx.get("is_account"):
        return JSONResponse(status_code=400, content={"message": "No es una cuenta por cobrar/pagar"})

    now = datetime.now(timezone.utc)
    payment_item = {
        "amount":        round(float(body.amount), 2),
        "note":          body.note or "",
        "date":          now.isoformat(),
        "registered_by": body.registered_by or user.get("id"),
    }

    current_paid = float(tx.get("amount_paid") or 0)
    new_paid = round(current_paid + float(body.amount), 2)
    total = float(tx.get("total") or 0)

    update: dict = {
        "$push": {"payment_history": payment_item},
        "$set":  {"amount_paid": new_paid},
    }
    if body.next_payment_date is not None:
        update["$set"]["next_payment_date"] = body.next_payment_date or None
    if new_paid >= total:
        update["$set"]["status"] = 2
        update["$set"]["completed_at"] = now.isoformat()
        update["$set"]["next_payment_date"] = None

    db.transactions.update_one({"_id": oid}, update)
    updated = db.transactions.find_one({"_id": oid})
    return serialize_doc(updated)


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

    base: dict = {"status": {"$ne": 0}}
    if body.fin_type:
        base["fin_type"] = body.fin_type
    if body.order_number:
        base["order_number"] = {"$regex": body.order_number, "$options": "i"}

    # Stage filter overrides the default status filter with a specific pipeline stage
    if body.stage:
        if body.stage == "pending":
            base["status"] = 1
            base["is_account"] = {"$ne": True}
        elif body.stage == "en-camino":
            base["status"] = 2
            base["delivery_status"] = {"$nin": ["delivered", "cancelled"]}
            base["is_account"] = {"$ne": True}
        elif body.stage == "finalizadas":
            base["status"] = 2
            base["delivery_status"] = "delivered"
            base["is_account"] = {"$ne": True}
        elif body.stage == "canceladas":
            base["delivery_status"] = "cancelled"
            base["is_account"] = {"$ne": True}
        elif body.stage == "cuentas-pendientes":
            base["is_account"] = True
            base["status"] = 3
        elif body.stage == "cuentas-cerradas":
            base["is_account"] = True
            base["status"] = 2

    query = base
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
            {"order_number": {"$regex": f, "$options": "i"}},
        ]
        if status_filter is not None:
            or_clauses.append({"status": bool(status_filter)})
        query = {"$and": [base, {"$or": or_clauses}]}

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
    query = {"status": {"$in": [False, 1]}}
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
    query: dict = {"status": 2}
    date_filter: dict = {}
    if start:
        dt = datetime.fromisoformat(start)
        date_filter["$gte"] = dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
    if end:
        dt = datetime.fromisoformat(end)
        date_filter["$lte"] = dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
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
    order_number = generate_order_number(db)
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
        "delivery_fee": body.delivery_fee or 0.0,
        "delivery_label": body.delivery_label or "",
        "channel": body.channel or "",
        "products": body.products or [],
        "productsTypes": body.productsTypes or [],
        "quantities": body.quantities or [],
        "lot_numbers": body.lot_numbers or [],
        "status": body.status if body.status in (1, 2) else 2,
        "is_manual": True,
        "order_number": order_number,
        "delivery_date": body.delivery_date or None,
        "delivery_status": "pending",
        "createdAt": datetime(
            *datetime.fromisoformat(body.created_at[:10]).timetuple()[:3],
            now.hour, now.minute, now.second, now.microsecond, timezone.utc
        ) if body.created_at else now,
        "updatedAt": now,
    }
    if body.seller_id_fk:
        try:
            doc["seller_id_fk"] = ObjectId(body.seller_id_fk)
        except Exception:
            pass
    if body.operational_costs:
        doc["operational_costs"] = [item.model_dump() for item in body.operational_costs]
    if body.coupon_id:
        try:
            doc["coupon_id"] = ObjectId(body.coupon_id)
        except Exception:
            doc["coupon_id"] = body.coupon_id
    if body.coupon_discount:
        doc["coupon_discount"] = body.coupon_discount
    if body.yappy_fee:
        doc["yappy_fee"] = body.yappy_fee
    if body.products_cost is not None:
        doc["products_cost"] = body.products_cost
    if body.products_prices:
        doc["products_prices"] = body.products_prices
    if body.provider_id_fk:
        try:
            doc["provider_id_fk"] = ObjectId(body.provider_id_fk)
        except Exception:
            pass
    if body.express_delivery:
        doc["express_delivery"] = True
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
    if body.operational_cost is not None:
        updates["operational_cost"] = body.operational_cost
    if body.operational_costs is not None:
        updates["operational_costs"] = [item.model_dump() for item in body.operational_costs]
    if body.products_cost is not None:
        updates["products_cost"] = body.products_cost
    if body.products_prices is not None:
        updates["products_prices"] = body.products_prices
    if body.total is not None:
        updates["total"] = body.total
    if body.seller_id_fk:
        try:
            updates["seller_id_fk"] = ObjectId(body.seller_id_fk)
        except Exception:
            pass
    if body.lot_numbers is not None:
        updates["lot_numbers"] = body.lot_numbers
    if body.delivery_date is not None:
        updates["delivery_date"] = body.delivery_date
    if body.delivery_assigned_to is not None:
        updates["delivery_assigned_to"] = body.delivery_assigned_to
    if body.delivery_assigned_name is not None:
        updates["delivery_assigned_name"] = body.delivery_assigned_name
    if body.provider_id_fk:
        try:
            updates["provider_id_fk"] = ObjectId(body.provider_id_fk)
        except Exception:
            pass
    if body.coupon_id:
        try:
            updates["coupon_id"] = ObjectId(body.coupon_id)
        except Exception:
            updates["coupon_id"] = body.coupon_id
    if body.coupon_discount is not None:
        updates["coupon_discount"] = body.coupon_discount
    if body.yappy_fee is not None:
        updates["yappy_fee"] = body.yappy_fee
    if body.delivery_label is not None:
        updates["delivery_label"] = body.delivery_label
    if body.direction is not None:
        updates["direction"] = body.direction

    result = db.transactions.update_one({"_id": oid}, {"$set": updates})
    if result.matched_count == 0:
        return JSONResponse(status_code=404, content={"message": "Transacción no encontrada"})

    doc = db.transactions.find_one({"_id": oid})
    if body.status == 2:
        mark_coupon_used(db, doc.get("coupon_id") if doc else None)
    return _populate_transaction(doc, db, include_products=True)


@router.delete("/api/transactions/{transaction_id}")
def delete_manual_transaction(transaction_id: str, db=Depends(get_db), _=Depends(verify_token)):
    oid = to_object_id(transaction_id)
    doc = db.transactions.find_one({"_id": oid})
    if not doc:
        return JSONResponse(status_code=404, content={"message": "Transacción no encontrada"})
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
