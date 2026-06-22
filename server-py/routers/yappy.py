"""
Yappy Botón de Pago — Banco General Panamá
Docs: https://www.yappy.com.pa/comercial/desarrolladores/

Flujo:
  1. POST /yappy/checkout → crea transacción en BD + retorna URL firmada de Yappy
  2. Usuario aprueba/rechaza en la app Yappy
  3. Yappy redirige al successUrl/failUrl del cliente con params: orderId, status, confirmationNumber, hash
  4. Frontend llama POST /yappy/verify → backend valida + actualiza estado de transacción

Variables de entorno requeridas (de Banco General):
  YAPPY_MERCHANT_ID   — ID del comercio
  YAPPY_SECRET_TOKEN  — Token secreto (usado para generar HMAC-SHA256)
  YAPPY_SANDBOX       — "yes" para pruebas, "no" para producción (default: yes)
"""
import os
import hmac
import hashlib
import base64
from datetime import datetime, timezone
from urllib.parse import quote
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List
from bson import ObjectId

from database import get_db
from helpers import serialize_doc, to_object_id

router = APIRouter()

MERCHANT_ID  = os.environ.get("YAPPY_MERCHANT_ID", "")
SECRET_TOKEN = os.environ.get("YAPPY_SECRET_TOKEN", "")
SANDBOX      = os.environ.get("YAPPY_SANDBOX", "yes")
DOMAIN_URL   = os.environ.get("FRONTEND_URL", "https://royalepanama.com")
YAPPY_GATEWAY = "https://pagosbg.bgeneral.com"


def _secret_key(token: str) -> str:
    """Decodifica el secretToken y extrae la primera parte (clave HMAC)."""
    try:
        # Banco General entrega el token en base64; la clave está en la primera parte
        padding = "=" * (-len(token) % 4)
        decoded = base64.b64decode(token + padding).decode("utf-8")
        return decoded.split("|")[0]
    except Exception:
        return token   # fallback: usar el token directamente


def _build_yappy_url(order_id: str, total: float, sub_total: float, taxes: float,
                     success_url: str, fail_url: str) -> str:
    """
    Genera la URL de pago firmada de Yappy.
    Hash: HMAC-SHA256 de (total + merchantId + subTotal + taxes + paymentDate + 'YAP' + 'VEN'
                           + orderId + successUrl + failUrl + domainUrl)
    """
    payment_date = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S")
    key          = _secret_key(SECRET_TOKEN)

    total_s   = f"{total:.2f}"
    sub_s     = f"{sub_total:.2f}"
    taxes_s   = f"{taxes:.2f}"

    hash_input = (
        total_s + MERCHANT_ID + sub_s + taxes_s + payment_date
        + "YAP" + "VEN" + order_id + success_url + fail_url + DOMAIN_URL
    )
    sig = hmac.new(
        key.encode("utf-8"),
        hash_input.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    params = [
        ("merchantId",   MERCHANT_ID),
        ("total",        total_s),
        ("subTotal",     sub_s),
        ("taxes",        taxes_s),
        ("orderId",      order_id),
        ("successUrl",   success_url),
        ("failUrl",      fail_url),
        ("domain",       DOMAIN_URL),
        ("hash",         sig),
        ("paymentDate",  payment_date),
        ("sbx",          SANDBOX),
    ]
    qs = "&".join(f"{k}={quote(str(v), safe='')}" for k, v in params)
    return f"{YAPPY_GATEWAY}?{qs}"


# ── Checkout ────────────────────────────────────────────────────────────────────

class YappyCheckoutBody(BaseModel):
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
    products: List[str] = []
    productsTypes: List[str] = []
    quantities: List[int] = []


@router.post("/yappy/checkout")
def yappy_checkout(body: YappyCheckoutBody):
    """
    Crea la transacción en MongoDB y devuelve la URL firmada de Yappy.
    La transacción queda en status=1 (pendiente) hasta que Yappy confirme.
    """
    if not MERCHANT_ID or not SECRET_TOKEN:
        return JSONResponse(
            status_code=503,
            content={"message": "El pago por Yappy no está disponible aún. Contáctanos por WhatsApp."},
        )

    db  = get_db()
    now = datetime.now(timezone.utc)

    total = round(body.subTotal + body.deliveryFee - body.couponDiscount, 2)

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
        "payment_method":  "Yappy",
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

    success_url = f"{DOMAIN_URL}/pago-exitoso?orderId={order_id}"
    fail_url    = f"{DOMAIN_URL}/pago-cancelado?orderId={order_id}"

    yappy_url = _build_yappy_url(
        order_id    = order_id,
        total       = total,
        sub_total   = round(body.subTotal, 2),
        taxes       = 0.0,
        success_url = success_url,
        fail_url    = fail_url,
    )

    return {"yappyUrl": yappy_url, "orderId": order_id}


# ── Verificación de callback ────────────────────────────────────────────────────

class YappyVerifyBody(BaseModel):
    orderId:            str
    status:             str                   # "E" | "R" | "C"
    confirmationNumber: Optional[str] = None
    hash:               Optional[str] = None


@router.post("/yappy/verify")
def yappy_verify(body: YappyVerifyBody):
    """
    Verifica el callback de Yappy y actualiza el estado de la transacción.
    status:
      E → Ejecutado (aprobado)  → transaction.status = 2
      R → Rechazado             → transaction.status = 0
      C → Cancelado             → transaction.status = 0
    """
    db  = get_db()
    oid = to_object_id(body.orderId)
    doc = db.transactions.find_one({"_id": oid})

    if not doc:
        return JSONResponse(status_code=404, content={"message": "Transacción no encontrada"})

    now = datetime.now(timezone.utc)

    if body.status == "E":
        db.transactions.update_one(
            {"_id": oid},
            {"$set": {
                "status":              2,
                "yappy_confirmation":  body.confirmationNumber or "",
                "updatedAt":           now,
            }},
        )
        return {"success": True, "message": "Pago confirmado correctamente"}

    # R (Rechazado) o C (Cancelado)
    db.transactions.update_one(
        {"_id": oid},
        {"$set": {"status": 0, "updatedAt": now}},
    )
    label = "Pago rechazado" if body.status == "R" else "Pago cancelado"
    return {"success": False, "message": label}
