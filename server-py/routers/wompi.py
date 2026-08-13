"""
Wompi Panama — Web Checkout (tarjeta / Clave)
Docs: https://docs.wompi.co/en/docs/panama/

Flujo:
  1. POST /wompi/checkout → crea transacción en BD + retorna URL firmada de Wompi
  2. Usuario paga en checkout.wompi.pa
  3. Wompi redirige a redirect-url?id={wompi_tx_id}
  4. Webhook POST /wompi/events actualiza el estado de la transacción en BD
  5. Frontend GET /wompi/status?wompi_id={id} consulta el estado final

Variables de entorno requeridas:
  WOMPI_PUBLIC_KEY     — pub_test_... / pub_prod_...
  WOMPI_PRIVATE_KEY    — prv_test_... / prv_prod_...  (para consultar la API REST)
  WOMPI_INTEGRITY_KEY  — test_integrity_... / prod_integrity_...
  WOMPI_EVENTS_KEY     — test_events_... / prod_events_...  (para verificar webhooks)
  WOMPI_SANDBOX        — "true" para pruebas, "false" para producción
"""
import os
import hashlib
import requests
from datetime import datetime, timezone
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List
from bson import ObjectId

from database import get_db
from helpers import to_object_id, generate_order_number, mark_coupon_used, compute_delivery_date

router = APIRouter()

PUBLIC_KEY     = os.environ.get("WOMPI_PUBLIC_KEY", "")
PRIVATE_KEY    = os.environ.get("WOMPI_PRIVATE_KEY", "")
INTEGRITY_KEY  = os.environ.get("WOMPI_INTEGRITY_KEY", "")
EVENTS_KEY     = os.environ.get("WOMPI_EVENTS_KEY", "")
SANDBOX        = os.environ.get("WOMPI_SANDBOX", "true").lower() in ("true", "yes", "1")
DOMAIN_URL     = os.environ.get("FRONTEND_URL", "https://royalepanama.com")

WOMPI_API_BASE = "https://api.wompi.pa/v1"
WOMPI_CHECKOUT = "https://checkout.wompi.pa/p/"


def _integrity_signature(reference: str, amount_cents: int) -> str:
    """SHA256(reference + amount_in_cents + 'USD' + INTEGRITY_KEY)"""
    raw = f"{reference}{amount_cents}USD{INTEGRITY_KEY}"
    return hashlib.sha256(raw.encode()).hexdigest()


def _build_wompi_url(reference: str, amount_cents: int) -> str:
    redirect = f"{DOMAIN_URL}/pago-wompi"
    sig = _integrity_signature(reference, amount_cents)
    params = [
        ("public-key",          PUBLIC_KEY),
        ("currency",            "USD"),
        ("amount-in-cents",     str(amount_cents)),
        ("reference",           reference),
        ("redirect-url",        redirect),
        ("signature:integrity", sig),
    ]
    qs = "&".join(f"{k}={v}" for k, v in params)
    return f"{WOMPI_CHECKOUT}?{qs}"


# ── Checkout ────────────────────────────────────────────────────────────────────

class WompiCheckoutBody(BaseModel):
    userName: str
    phone: str
    direction: str = ""
    email: str = ""
    subTotal: float
    deliveryFee: float = 0.0
    couponDiscount: float = 0.0
    couponId: Optional[str] = None
    deliveryLabel: Optional[str] = None
    deliveryId: Optional[str] = None
    channel: str = "Sitio Web"
    products: List[str] = []
    productsTypes: List[str] = []
    quantities: List[int] = []
    products_prices: List[float] = []
    express_delivery: bool = False
    express_fee: float = 0.0
    newsletter: bool = False


@router.post("/wompi/checkout")
def wompi_checkout(body: WompiCheckoutBody):
    if not PUBLIC_KEY or not INTEGRITY_KEY:
        return JSONResponse(
            status_code=503,
            content={"message": "El pago por Wompi no está disponible aún. Usa otro método de pago."},
        )

    db  = get_db()
    now = datetime.now(timezone.utc)

    total = round(body.subTotal + body.deliveryFee - body.couponDiscount, 2)
    amount_cents = int(round(total * 100))
    order_number = generate_order_number(db)
    delivery_date = compute_delivery_date(body.express_delivery)

    doc = {
        "userName":        body.userName,
        "phone":           body.phone,
        "direction":       body.direction,
        "email":           body.email,
        "subTotal":        round(body.subTotal, 2),
        "total":           total,
        "delivery_fee":    body.deliveryFee,
        "delivery_label":  body.deliveryLabel or "",
        "coupon_discount": body.couponDiscount,
        "products":        body.products,
        "productsTypes":   body.productsTypes,
        "quantities":      body.quantities,
        "products_prices": body.products_prices,
        "channel":         body.channel,
        "payment_method":  "Wompi",
        "express_delivery": body.express_delivery,
        "express_fee":     body.express_fee,
        "order_number":    order_number,
        "delivery_date":   delivery_date,
        "delivery_status": "pending",
        "status":          1,
        "createdAt":       now,
        "updatedAt":       now,
    }
    if body.couponId:
        try:
            doc["coupon_id"] = ObjectId(body.couponId)
        except Exception:
            pass

    result   = db.transactions.insert_one(doc)
    order_id = str(result.inserted_id)

    if body.newsletter and body.email:
        existing = db.subscribers.find_one({"email": body.email})
        if not existing:
            db.subscribers.insert_one({"email": body.email, "createdAt": now})

    wompi_url = _build_wompi_url(reference=order_id, amount_cents=amount_cents)

    return {"wompiUrl": wompi_url, "orderId": order_id}


# ── Status (consultado por el frontend al regresar del checkout) ─────────────

@router.get("/wompi/status")
def wompi_status(wompi_id: str):
    """
    Consulta el estado de una transacción de Wompi por su ID (el que Wompi
    pasa en ?id= al redirigir al redirect-url).
    """
    if not PRIVATE_KEY:
        return JSONResponse(
            status_code=503,
            content={"message": "Verificación no disponible. Contáctanos por WhatsApp."},
        )

    try:
        resp = requests.get(
            f"{WOMPI_API_BASE}/transactions/{wompi_id}",
            headers={"Authorization": f"Bearer {PRIVATE_KEY}"},
            timeout=10,
        )
        resp.raise_for_status()
        tx_data = resp.json().get("data", {})
        status  = tx_data.get("status", "")
        reference = tx_data.get("reference", "")   # = nuestro orderId
        return {"status": status, "orderId": reference}
    except Exception:
        return JSONResponse(
            status_code=502,
            content={"message": "No se pudo verificar el pago. Contáctanos si el cobro fue procesado."},
        )


# ── Webhook de Wompi ──────────────────────────────────────────────────────────

@router.post("/wompi/events")
async def wompi_events(request: Request):
    """
    Recibe eventos de Wompi (transaction.updated).
    Wompi envía el header X-Event-Checksum; verificación opcional usando EVENTS_KEY.
    """
    try:
        payload = await request.json()
    except Exception:
        return JSONResponse(status_code=400, content={"message": "Invalid JSON"})

    event = payload.get("event", "")
    if event != "transaction.updated":
        return {"received": True}

    tx_data   = payload.get("data", {}).get("transaction", {})
    reference = tx_data.get("reference", "")
    status    = tx_data.get("status", "")
    wompi_id  = tx_data.get("id", "")

    if not reference:
        return {"received": True}

    db  = get_db()
    now = datetime.now(timezone.utc)

    oid = to_object_id(reference)
    if not oid:
        return {"received": True}

    if status == "APPROVED":
        doc = db.transactions.find_one({"_id": oid}, {"coupon_id": 1})
        db.transactions.update_one(
            {"_id": oid},
            {"$set": {
                "status":    2,
                "wompi_tx_id": wompi_id,
                "updatedAt": now,
            }},
        )
        if doc:
            mark_coupon_used(db, doc.get("coupon_id"))
    elif status in ("DECLINED", "VOIDED", "ERROR"):
        db.transactions.update_one(
            {"_id": oid},
            {"$set": {
                "status":    0,
                "wompi_tx_id": wompi_id,
                "updatedAt": now,
            }},
        )

    return {"received": True}
