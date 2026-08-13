"""
Yappy Botón de Pago V2 — Banco General Panamá
Nueva integración: dos llamados HTTP en backend + web component en frontend.

Flujo V2:
  1. POST /yappy/checkout
     → Step 1: POST /payments/validate/merchant → session token
     → Step 2: POST /payments/payment-wc → {transactionId, token, documentName}
     → Retorna esos datos al frontend
  2. Frontend carga CDN y renderiza <btn-yappy token="..." document-name="...">
  3. Usuario aprueba en la app Yappy
  4. El web component llama GET /yappy/validate-hash con orderId+status+hash+domain
  5. Backend valida HMAC y actualiza estado en MongoDB

Variables de entorno:
  YAPPY_MERCHANT_ID   — ID del comercio (Yappy Comercial)
  YAPPY_SECRET_TOKEN  — Token secreto en base64
  YAPPY_SANDBOX       — "yes" para pruebas, "no" para producción
  YAPPY_DOMAIN        — Dominio registrado en portal Yappy (e.g. https://www.royalepanama.com)
"""
import os
import hmac
import hashlib
import base64
import time
import logging
import requests as http_requests
from datetime import datetime, timezone
from fastapi import APIRouter
from fastapi.responses import JSONResponse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
from pydantic import BaseModel
from typing import Optional, List
from bson import ObjectId

from database import get_db
from helpers import serialize_doc, to_object_id, generate_order_number, mark_coupon_used, compute_delivery_date

router = APIRouter()

MERCHANT_ID  = os.environ.get("YAPPY_MERCHANT_ID", "")
SECRET_TOKEN = os.environ.get("YAPPY_SECRET_TOKEN", "")
_SANDBOX     = os.environ.get("YAPPY_SANDBOX", "yes").lower() in ("yes", "true", "1")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://royalepanama.com")
DOMAIN_URL   = os.environ.get("YAPPY_DOMAIN", FRONTEND_URL)

GATEWAY = (
    "https://api-comecom-uat.yappycloud.com" if _SANDBOX
    else "https://apipagosbg.bgeneral.cloud"
)
CDN_URL = (
    "https://bt-cdn-uat.yappycloud.com/v1/cdn/web-component-btn-yappy.js" if _SANDBOX
    else "https://bt-cdn.yappy.cloud/v1/cdn/web-component-btn-yappy.js"
)


def _decode_secret() -> str:
    """Decodifica el secretToken base64 → texto completo."""
    try:
        padding = "=" * (-len(SECRET_TOKEN) % 4)
        return base64.b64decode(SECRET_TOKEN + padding).decode("utf-8")
    except Exception:
        return SECRET_TOKEN


def _hmac_key() -> str:
    """Clave HMAC para validar callbacks: primera parte del secreto decodificado (antes del primer '.')."""
    decoded = _decode_secret()
    return decoded.split(".")[0]


def _short_id(mongo_id: str) -> str:
    """Yappy V2 limita orderId a 15 caracteres alfanuméricos. Usamos los últimos 15 del ObjectId hex."""
    return mongo_id[-15:]


def _validate_merchant() -> Optional[str]:
    """Step 1: POST /payments/validate/merchant - session token."""
    try:
        url = f"{GATEWAY}/payments/validate/merchant"
        payload = {"merchantId": MERCHANT_ID, "urlDomain": DOMAIN_URL}
        print(f"[YAPPY] validate-merchant POST {url} body={payload}")
        r = http_requests.post(
            url,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=10,
        )
        print(f"[YAPPY] validate-merchant status={r.status_code} body={r.text[:800]}")
        data = r.json()
        token = data.get("body", {}).get("token")
        print(f"[YAPPY] validate-merchant token={'[OK]' if token else '[EMPTY]'}")
        return token
    except Exception as exc:
        print(f"[YAPPY] validate-merchant EXCEPTION: {exc}")
        return None


def _create_order(session_token: str, payload: dict) -> Optional[dict]:
    """Step 2: POST /payments/payment-wc - {transactionId, token, documentName}."""
    try:
        url = f"{GATEWAY}/payments/payment-wc"
        print(f"[YAPPY] create-order POST {url} body={payload}")
        r = http_requests.post(
            url,
            json=payload,
            headers={"Authorization": session_token, "Content-Type": "application/json"},
            timeout=10,
        )
        print(f"[YAPPY] create-order status={r.status_code} body={r.text[:800]}")
        data = r.json()
        code = str(data.get("status", {}).get("code", "")).strip()
        if not (code.lstrip("0") == "" or code in ("00", "0", "000", "0000")):
            print(f"[YAPPY] create-order codigo inesperado: {code} respuesta={data}")
            return None
        return data.get("body", {})
    except Exception as exc:
        print(f"[YAPPY] create-order EXCEPTION: {exc}")
        return None


# ── Modelos ──────────────────────────────────────────────────────────────────────

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
    channel: str = "Sitio Web"
    products: List[str] = []
    productsTypes: List[str] = []
    quantities: List[int] = []
    products_prices: List[float] = []
    express_delivery: bool = False
    express_fee: float = 0.0
    yappy_fee: float = 0.0  # ignorado — la comisión se calcula internamente
    newsletter: bool = False


# ── Checkout ─────────────────────────────────────────────────────────────────────

@router.post("/yappy/checkout")
def yappy_checkout(body: YappyCheckoutBody):
    """
    Crea la transacción en MongoDB y ejecuta los dos llamados a Yappy V2.
    Devuelve al frontend: orderId, token, documentName, cdnUrl.
    """
    if not MERCHANT_ID or not SECRET_TOKEN:
        return JSONResponse(
            status_code=503,
            content={"message": "El pago por Yappy no está disponible aún. Contáctanos por WhatsApp."},
        )

    db  = get_db()
    now = datetime.now(timezone.utc)
    total = round(body.subTotal + body.deliveryFee - body.couponDiscount, 2)
    yappy_commission = round(total * 0.0107, 2)  # comisión interna: 1% + 7% ITBMS
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
        "payment_method":  "Yappy",
        "express_delivery": body.express_delivery,
        "express_fee":     body.express_fee,
        "yappy_fee":       yappy_commission,
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
    mongo_id = str(result.inserted_id)
    yappy_id = _short_id(mongo_id)

    if body.newsletter and body.email:
        existing = db.subscribers.find_one({"email": body.email})
        if not existing:
            db.subscribers.insert_one({"email": body.email, "createdAt": now})

    # Guardamos el yappy_order_id para poder buscar la transacción luego
    db.transactions.update_one(
        {"_id": result.inserted_id},
        {"$set": {"yappy_order_id": yappy_id}},
    )

    # Step 1: obtener session token
    session_token = _validate_merchant()
    if not session_token:
        db.transactions.delete_one({"_id": result.inserted_id})
        return JSONResponse(
            status_code=502,
            content={"message": "No se pudo conectar con Yappy. Intenta nuevamente o usa WhatsApp."},
        )

    # Step 2: crear orden
    ipn_url = "https://api.royalepanama.com/yappy/ipn"
    yappy_taxes = round(body.deliveryFee, 2)
    order_payload = {
        "merchantId":  MERCHANT_ID,
        "orderId":     yappy_id,
        "domain":      DOMAIN_URL,
        "paymentDate": int(time.time() * 1000),
        "ipnUrl":      ipn_url,
        "discount":    f"{body.couponDiscount:.2f}",
        "taxes":       f"{yappy_taxes:.2f}",
        "subtotal":    f"{round(body.subTotal, 2):.2f}",
        "total":       f"{total:.2f}",
    }

    # aliasYappy: obligatorio en UAT; opcional pero incluido en producción (pre-llena el teléfono en la app Yappy)
    clean_phone = "".join(c for c in body.phone if c.isdigit())[-8:]
    if clean_phone:
        order_payload["aliasYappy"] = clean_phone

    order_body = _create_order(session_token, order_payload)
    if not order_body:
        db.transactions.delete_one({"_id": result.inserted_id})
        return JSONResponse(
            status_code=502,
            content={"message": "Yappy no pudo procesar la orden. Verifica tus datos e intenta de nuevo."},
        )

    yappy_tx_id = order_body.get("transactionId", "")
    if yappy_tx_id:
        db.transactions.update_one(
            {"_id": result.inserted_id},
            {"$set": {"yappy_tx_id": yappy_tx_id}},
        )

    return {
        "orderId":      mongo_id,
        "orderNumber":  order_number,
        "yappyOrderId": yappy_id,
        "token":        order_body.get("token", ""),
        "documentName": order_body.get("documentName", ""),
        "cdnUrl":       CDN_URL,
    }


# ── validate-hash (llamado por el web component después del pago) ─────────────────

@router.get("/yappy/validate-hash")
def yappy_validate_hash(orderId: str = "", status: str = "", hash: str = "", domain: str = ""):
    """
    El web component de Yappy llama a este endpoint para confirmar el pago.
    Valida el HMAC y actualiza el estado de la transacción en MongoDB.
    """
    msg = orderId + status + domain

    # Intentamos los tres candidatos de clave para diagnosticar cuál usa Yappy
    key_split  = _hmac_key()                    # primera parte antes del primer "."
    key_full   = _decode_secret()               # secretToken decodificado completo
    key_raw    = SECRET_TOKEN                   # secretToken base64 sin decodificar

    def _compute(k: str) -> str:
        return hmac.new(k.encode("utf-8"), msg.encode("utf-8"), hashlib.sha256).hexdigest()

    hash_split = _compute(key_split)
    hash_full  = _compute(key_full)
    hash_raw   = _compute(key_raw)

    print(f"[YAPPY] validate-hash orderId={orderId} status={status} domain={domain}")
    print(f"[YAPPY] validate-hash received_hash={hash}")
    print(f"[YAPPY] validate-hash hash_split={hash_split}")
    print(f"[YAPPY] validate-hash hash_full={hash_full}")
    print(f"[YAPPY] validate-hash hash_raw={hash_raw}")

    valid = hash in (hash_split, hash_full, hash_raw)
    print(f"[YAPPY] validate-hash valid={valid}")

    db  = get_db()
    now = datetime.now(timezone.utc)
    doc = db.transactions.find_one({"yappy_order_id": orderId})
    print(f"[YAPPY] validate-hash doc_found={doc is not None}")

    if doc and valid:
        new_status = 2 if status == "E" else 0
        db.transactions.update_one(
            {"_id": doc["_id"]},
            {"$set": {"status": new_status, "yappy_status": status, "updatedAt": now}},
        )
        print(f"[YAPPY] validate-hash updated doc to status={new_status}")
        if new_status == 2:
            mark_coupon_used(db, doc.get("coupon_id"))

    return {"success": valid}


# ── IPN — notificación push de Yappy al backend ───────────────────────────────────

@router.get("/yappy/ipn")
def yappy_ipn(orderId: str = "", status: str = "", domain: str = "", hash: str = ""):
    """
    Yappy llama a este endpoint via GET con query params para notificar el resultado del pago.
    Valida HMAC y actualiza la transacción.
    """
    order_id = orderId
    rcv_hash = hash
    if not domain:
        domain = DOMAIN_URL

    key = _hmac_key()
    expected = hmac.new(
        key.encode("utf-8"),
        (order_id + status + domain).encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    if rcv_hash and rcv_hash != expected:
        return JSONResponse(status_code=401, content={"message": "Hash inválido"})

    db  = get_db()
    now = datetime.now(timezone.utc)
    doc = db.transactions.find_one({"yappy_order_id": order_id})

    if doc:
        new_status = 2 if status == "E" else 0
        db.transactions.update_one(
            {"_id": doc["_id"]},
            {"$set": {"status": new_status, "yappy_status": status, "updatedAt": now}},
        )
        if new_status == 2:
            mark_coupon_used(db, doc.get("coupon_id"))

    return {"success": True}


# ── Verify — consulta de estado desde el frontend ─────────────────────────────────

class YappyVerifyBody(BaseModel):
    orderId: str  # MongoDB ObjectId (24 chars)


def _query_yappy_transaction(yappy_tx_id: str, api_key: str = "", secret_key: str = "") -> Optional[str]:
    """
    Consulta el estado de una transacción usando la API de Historial de Yappy:
    GET /v1/movement/{transaction-id}
    Requiere credenciales separadas (api-key, secret-key) provistas por Banco General.
    Retorna body.status ("COMPLETED", etc.) o None si no tiene credenciales o falla.
    """
    MOVEMENT_API_KEY    = os.environ.get("YAPPY_MOVEMENT_API_KEY",    api_key)
    MOVEMENT_SECRET_KEY = os.environ.get("YAPPY_MOVEMENT_SECRET_KEY", secret_key)

    if not MOVEMENT_API_KEY or not MOVEMENT_SECRET_KEY:
        print(f"[YAPPY] movement skipped — YAPPY_MOVEMENT_API_KEY/SECRET_KEY not configured")
        return None

    url           = f"{GATEWAY}/v1/movement/{yappy_tx_id}"
    session_token = _validate_merchant() or ""
    try:
        headers = {
            "Content-Type":  "application/json",
            "authorization": session_token,
            "api-key":       MOVEMENT_API_KEY,
            "secret-key":    MOVEMENT_SECRET_KEY,
            "client-ip":     "127.0.0.1",
            "channel":       "WEB",
        }
        print(f"[YAPPY] movement GET {url}")
        r = http_requests.get(url, headers=headers, timeout=10)
        print(f"[YAPPY] movement status={r.status_code} body={r.text[:600]}")
        if r.status_code == 200:
            status = r.json().get("body", {}).get("status", "")
            print(f"[YAPPY] movement tx_status={status}")
            return status if status else None
    except Exception as exc:
        print(f"[YAPPY] movement EXCEPTION: {exc}")
    return None


@router.post("/yappy/verify")
def yappy_verify(body: YappyVerifyBody):
    """
    Consulta el estado de una transacción Yappy.
    Si sigue pendiente (status=1), consulta la API de Yappy directamente para forzar sincronización.
    """
    db  = get_db()
    oid = to_object_id(body.orderId)
    doc = db.transactions.find_one({"_id": oid})

    if not doc:
        return JSONResponse(status_code=404, content={"message": "Transacción no encontrada"})

    db_status  = doc.get("status", 1)
    checked_api = False

    # Si sigue pendiente, consultar la API de Yappy directamente usando yappy_tx_id
    if db_status == 1:
        # yappy_tx_id es el ID que devuelve Yappy (ej. "QMSJX-65188140"), más fiable que yappy_order_id
        yappy_tx_id = doc.get("yappy_tx_id", "") or doc.get("yappy_order_id", "")
        if yappy_tx_id:
            checked_api = True
            yappy_status = _query_yappy_transaction(yappy_tx_id)
            print(f"[YAPPY] verify direct-check yappy_status={yappy_status} for tx={yappy_tx_id}")
            now = datetime.now(timezone.utc)
            # /v1/movement devuelve "COMPLETED"; /payments/transaction devuelve "E"
            paid_statuses      = {"COMPLETED", "E"}
            cancelled_statuses = {"REJECTED", "CANCELLED", "FAILED", "EXPIRED", "R", "C", "F", "X"}
            if yappy_status in paid_statuses:
                db.transactions.update_one(
                    {"_id": oid},
                    {"$set": {"status": 2, "yappy_status": yappy_status, "updatedAt": now}},
                )
                db_status = 2
                print(f"[YAPPY] verify updated to PAID for tx={yappy_tx_id} ({yappy_status})")
            elif yappy_status in cancelled_statuses:
                db.transactions.update_one(
                    {"_id": oid},
                    {"$set": {"status": 0, "yappy_status": yappy_status, "updatedAt": now}},
                )
                db_status = 0
                print(f"[YAPPY] verify updated to CANCELLED for tx={yappy_tx_id} ({yappy_status})")
            else:
                print(f"[YAPPY] verify status still pending for tx={yappy_tx_id} ({yappy_status})")

    return {"status": db_status, "orderId": body.orderId, "checked": checked_api}
