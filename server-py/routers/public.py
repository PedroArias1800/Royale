"""
Public routes — no authentication required.
These mirror the client-facing endpoints originally in index.routes.js.
"""
import html as html_lib
from fastapi import APIRouter, Depends, Query
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel
from typing import Optional, List
from bson import ObjectId

from database import get_db
from auth import verify_token
from helpers import serialize_doc, to_object_id, generate_order_number

router = APIRouter()


# ── POST /cart ─────────────────────────────────────────────────────────────────
class CartItem(BaseModel):
    id: str
    types_id: str

@router.post("/cart")
def post_cart(cart_items: List[CartItem]):
    db = get_db()
    parfum_ids = [ObjectId(item.id) for item in cart_items]
    type_ids   = [ObjectId(item.types_id) for item in cart_items]

    parfums = list(db.parfums.aggregate([
        {"$match": {"_id": {"$in": parfum_ids}}},
        {"$lookup": {"from": "brands",   "localField": "brand_id_fk",   "foreignField": "_id", "as": "brand"}},
        {"$lookup": {"from": "versions", "localField": "version_id_fk", "foreignField": "_id", "as": "version"}},
        {"$unwind": "$brand"},
        {"$unwind": "$version"},
    ]))
    types = list(db.types.find({"_id": {"$in": type_ids}, "parfum_id_fk": {"$in": parfum_ids}}))

    result = []
    for t in types:
        parfum = next((p for p in parfums if p["_id"] == t["parfum_id_fk"]), None)
        if parfum:
            result.append({"parfum": serialize_doc(parfum), "type": serialize_doc(t)})
    return result


# ── GET /parfum?id=... ─────────────────────────────────────────────────────────
@router.get("/parfum")
def parfum_version(id: str = Query(...)):
    db = get_db()
    pipeline = [
        {"$match": {"_id": ObjectId(id)}},
        {
            "$lookup": {
                "from": "types",
                "localField": "_id",
                "foreignField": "parfum_id_fk",
                "pipeline": [{"$match": {"$expr": {"$eq": ["$status", 1]}}}],
                "as": "types",
            }
        },
        {"$lookup": {"from": "versions", "localField": "version_id_fk", "foreignField": "_id", "as": "version"}},
        {"$lookup": {"from": "brands", "localField": "brand_id_fk", "foreignField": "_id", "as": "brand"}},
        {"$unwind": "$version"},
        {"$unwind": "$brand"},
    ]
    result = list(db.parfums.aggregate(pipeline))
    if not result:
        return JSONResponse(status_code=404, content={"message": "Parfum not Found"})
    return serialize_doc(result[0])


# ── GET /parfums?type=Normal ───────────────────────────────────────────────────
@router.get("/parfums")
def all_parfums(type: str = Query(default="Normal")):
    db = get_db()
    type_of_sale = type
    pipeline = [
        {"$match": {"status": 1}},
        {
            "$lookup": {
                "from": "types",
                "let": {"parfumId": "$_id"},
                "pipeline": [
                    {
                        "$match": {
                            "$expr": {
                                "$and": [
                                    {"$eq": ["$parfum_id_fk", "$$parfumId"]},
                                    {"$eq": ["$status", 1]},
                                    {
                                        "$or": [
                                            {"$eq": ["$type_of_sale", type_of_sale]},
                                            {
                                                "$and": [
                                                    {"$eq": [type_of_sale, "Normal"]},
                                                    {"$not": [{"$ifNull": ["$type_of_sale", False]}]},
                                                ]
                                            },
                                        ]
                                    },
                                ]
                            }
                        }
                    }
                ],
                "as": "types",
            }
        },
        {"$match": {"types.0": {"$exists": True}}},
        {"$lookup": {"from": "versions", "localField": "version_id_fk", "foreignField": "_id", "as": "version"}},
        {"$unwind": "$version"},
        {"$lookup": {"from": "brands", "localField": "brand_id_fk", "foreignField": "_id", "as": "brand"}},
        {"$unwind": "$brand"},
    ]
    return [serialize_doc(d) for d in db.parfums.aggregate(pipeline)]


# ── GET /parfums/body ──────────────────────────────────────────────────────────
@router.get("/parfums/body")
def parfums_body():
    db = get_db()
    pipeline = [
        {"$match": {"status": 1}},
        {"$lookup": {"from": "parfums", "localField": "parfum_id_fk", "foreignField": "_id", "as": "parfum_id_fk"}},
        {"$unwind": {"path": "$parfum_id_fk", "preserveNullAndEmptyArrays": True}},
        {"$sort": {"updatedAt": -1}},
    ]
    return [serialize_doc(d) for d in db.bodies.aggregate(pipeline)]


# ── GET /promotions ────────────────────────────────────────────────────────────
@router.get("/promotions")
def get_active_promotions():
    db = get_db()
    return [serialize_doc(d) for d in db.promotions.find({"status": 1}).sort("title", 1)]


# ── GET /cupon?id=<code> ───────────────────────────────────────────────────────
@router.get("/cupon")
def get_cupon(id: str = Query(...)):
    db = get_db()
    coupon = db.coupons.find_one({"code": id})
    if not coupon:
        return JSONResponse(status_code=404, content={"_id": "", "valido": False, "texto": "Cupón no Válido"})

    if coupon.get("status") == 0:
        return {
            "_id": "",
            "valido": False,
            "texto": "Este cupón no está disponible",
            "percentage": 0,
        }

    max_uses = coupon.get("max_uses")
    if max_uses is not None and coupon.get("uses_count", 0) >= max_uses:
        return {
            "_id": "",
            "valido": False,
            "texto": "Este cupón ha alcanzado su límite de usos",
            "percentage": 0,
        }

    aplican_map = {0: "Todos", 1: "Damas", 2: "Caballeros"}
    aplican = aplican_map.get(coupon.get("productsThatApply", 0), "Todos")
    return {
        "_id": str(coupon["_id"]),
        "valido": True,
        "texto": f"{coupon['percentage']}% de descuento por {coupon['title']} a los siguientes productos: {aplican}",
        "productsThatApply": coupon.get("productsThatApply"),
        "percentage": coupon.get("percentage"),
        "code": coupon.get("code"),
    }


# ── GET /share/parfum?id=... — HTML shim con OG tags para WhatsApp / redes ────
@router.get("/share/parfum", response_class=HTMLResponse)
def share_parfum(id: str = Query(...)):
    db = get_db()
    pipeline = [
        {"$match": {"_id": ObjectId(id)}},
        {
            "$lookup": {
                "from": "types",
                "localField": "_id",
                "foreignField": "parfum_id_fk",
                "pipeline": [{"$match": {"$expr": {"$eq": ["$status", 1]}}}],
                "as": "types",
            }
        },
        {"$lookup": {"from": "versions", "localField": "version_id_fk", "foreignField": "_id", "as": "version"}},
        {"$lookup": {"from": "brands",   "localField": "brand_id_fk",   "foreignField": "_id", "as": "brand"}},
        {"$unwind": "$version"},
        {"$unwind": "$brand"},
    ]
    result = list(db.parfums.aggregate(pipeline))
    if not result:
        return HTMLResponse("<html><body>Not found</body></html>", status_code=404)

    p = serialize_doc(result[0])
    brand   = p.get("brand", {}).get("brand_name", "")
    title   = p.get("title", "")
    version = p.get("version", {}).get("version_name", "")
    desc    = p.get("description") or f"Descubre {brand} {title} en Royale Panama"
    img_url = (p.get("types") or [{}])[0].get("img", "")
    spa_url = f"https://royalepanama.com/parfum?id={id}"

    og_title = html_lib.escape(f"{brand} {title} {version}".strip())
    og_desc  = html_lib.escape(desc)
    og_img   = html_lib.escape(img_url)
    og_url   = html_lib.escape(spa_url)

    page = f"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>{og_title} — Royale Panama</title>
  <meta property="og:type"        content="product" />
  <meta property="og:site_name"   content="Royale Panama" />
  <meta property="og:title"       content="{og_title}" />
  <meta property="og:description" content="{og_desc}" />
  <meta property="og:image"       content="{og_img}" />
  <meta property="og:image:width" content="800" />
  <meta property="og:image:height" content="800" />
  <meta property="og:url"         content="{og_url}" />
  <meta name="twitter:card"        content="summary_large_image" />
  <meta name="twitter:title"       content="{og_title}" />
  <meta name="twitter:description" content="{og_desc}" />
  <meta name="twitter:image"       content="{og_img}" />
  <meta http-equiv="refresh" content="0;url={og_url}" />
  <script>window.location.replace("{og_url}");</script>
</head>
<body>
  <p>Redirigiendo a <a href="{og_url}">{og_title}</a>…</p>
</body>
</html>"""
    return HTMLResponse(content=page)


# ── GET /delivery/public ──────────────────────────────────────────────────────
@router.get("/delivery/public")
def get_delivery_options_public():
    db = get_db()
    gratis = db.delivery_prices.find_one({"delivery_type": "gratis", "active": True})
    # One global metro record — price applies to all stations
    metro  = db.delivery_prices.find_one({"delivery_type": "metro", "active": True})
    zona_available = db.delivery_prices.count_documents({"delivery_type": "zona", "active": True}) > 0
    return {
        "gratis":         serialize_doc(gratis) if gratis else None,
        "metro":          serialize_doc(metro) if metro else None,
        "zona_available": zona_available,
    }


class ResolveDeliveryBody(BaseModel):
    province:      str
    district:      Optional[str] = None
    corregimiento: Optional[str] = None


@router.post("/delivery/public/resolve")
def resolve_delivery_price(body: ResolveDeliveryBody):
    db = get_db()
    base = {"delivery_type": "zona", "active": True, "province": body.province}

    # Priority: corregimiento > district > province
    if body.corregimiento and body.district:
        doc = db.delivery_prices.find_one({
            **base, "district": body.district, "corregimiento": body.corregimiento
        })
        if doc:
            return {**serialize_doc(doc), "matched_level": "corregimiento"}

    if body.district:
        doc = db.delivery_prices.find_one({
            **base, "district": body.district,
            "$or": [{"corregimiento": None}, {"corregimiento": {"$exists": False}}]
        })
        if doc:
            return {**serialize_doc(doc), "matched_level": "distrito"}

    doc = db.delivery_prices.find_one({
        **base,
        "$or": [{"district": None}, {"district": {"$exists": False}}],
    })
    if doc:
        return {**serialize_doc(doc), "matched_level": "provincia"}

    return JSONResponse(status_code=404, content={"message": "No hay precio configurado para esta zona"})


# ── GET /transaction (pending, protected) ─────────────────────────────────────
@router.get("/transaction")
def get_pending_transactions(_: dict = Depends(verify_token)):
    db = get_db()
    docs = list(db.transactions.find({"status": {"$in": [False, 1]}}))
    return [serialize_doc(d) for d in docs]


# ── POST /transaction ──────────────────────────────────────────────────────────
class TransactionBody(BaseModel):
    userName: str
    phone: str
    direction: str
    email: str = ""
    subTotal: float
    total: float
    products: List[str]
    productsTypes: List[str]
    quantities: List[int]
    seller_id_fk: Optional[str] = None
    delivery_fee: float = 0.0
    delivery_label: str = ""
    payment_method: str = "WhatsApp"
    channel: Optional[str] = None
    products_prices: Optional[List[float]] = []
    express_delivery: bool = False
    express_fee: float = 0.0
    newsletter: bool = False


@router.post("/transaction")
def create_transaction(body: TransactionBody):
    db = get_db()
    from datetime import datetime, timezone
    from helpers import compute_delivery_date
    now = datetime.now(timezone.utc)
    order_number = generate_order_number(db)
    delivery_date = compute_delivery_date(body.express_delivery)
    doc = {
        "userName": body.userName,
        "phone": body.phone,
        "direction": body.direction,
        "email": body.email,
        "subTotal": body.subTotal,
        "total": body.total,
        "delivery_fee": body.delivery_fee,
        "delivery_label": body.delivery_label,
        "payment_method": body.payment_method,
        "channel": body.channel or "",
        "products": body.products,
        "productsTypes": body.productsTypes,
        "quantities": body.quantities,
        "products_prices": body.products_prices or [],
        "express_delivery": body.express_delivery,
        "express_fee": body.express_fee,
        "order_number": order_number,
        "delivery_date": delivery_date,
        "delivery_status": "pending",
        "status": 1,
        "createdAt": now,
        "updatedAt": now,
    }
    if body.seller_id_fk:
        try:
            doc["seller_id_fk"] = ObjectId(body.seller_id_fk)
        except Exception:
            pass
    result = db.transactions.insert_one(doc)
    doc["_id"] = result.inserted_id
    if body.newsletter and body.email:
        existing = db.subscribers.find_one({"email": body.email})
        if not existing:
            db.subscribers.insert_one({"email": body.email, "createdAt": now})
    return serialize_doc(doc)


# ── Newsletter ────────────────────────────────────────────────────────────────

class NewsletterBody(BaseModel):
    email: str


@router.post("/newsletter")
def subscribe_newsletter(body: NewsletterBody):
    db = get_db()
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    existing = db.subscribers.find_one({"email": body.email})
    if existing:
        return {"message": "Ya estás suscrito"}
    db.subscribers.insert_one({"email": body.email, "createdAt": now})
    return {"message": "Suscrito con éxito"}


# ── PUT /transaction/:id (mark as attended, protected) ────────────────────────
@router.put("/transaction/{id}")
def update_transaction(id: str, _: dict = Depends(verify_token)):
    db = get_db()
    from datetime import datetime, timezone
    doc = db.transactions.find_one_and_update(
        {"_id": to_object_id(id)},
        {"$set": {"status": True, "updatedAt": datetime.now(timezone.utc)}},
        return_document=True,
    )
    if not doc:
        return JSONResponse(status_code=404, content={"message": "Transaction not found"})
    # Return remaining pending transactions (same behavior as original)
    pending = list(db.transactions.find({"status": False}))
    return [serialize_doc(d) for d in pending]
