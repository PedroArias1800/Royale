# Plan: Integración Wompi Panama

## Contexto

El cliente quiere añadir Wompi como método de pago en la tienda (`royalepanama.com`). Wompi es el gateway de pago de Bancolombia disponible en Panama, soporta tarjetas (Visa/Mastercard) y Clave (red de débito nacional). El patrón a seguir es idéntico al de Yappy (que ya está integrado): crear la transacción pendiente en el backend → redirigir al checkout externo → confirmar por webhook.

---

## Cómo funciona Wompi Panama (Web Checkout)

### 4 claves necesarias (2 juegos: sandbox + producción)
| Clave | Prefijo sandbox | Prefijo producción | Uso |
|---|---|---|---|
| **Public key** | `pub_test_...` | `pub_prod_...` | Parámetro del checkout (frontend visible) |
| **Private key** | `prv_test_...` | `prv_prod_...` | Llamadas API REST desde el backend |
| **Integrity key** | `test_integrity_...` | `prod_integrity_...` | Generar firma SHA256 del checkout |
| **Events key** | `test_events_...` | `prod_events_...` | Verificar autenticidad de webhooks |

### Flujo de pago

```
[PaymentModal] → handleWompi()
    ↓ POST /wompi/checkout
[server-py/routers/wompi.py]
  → inserta transaction (status=1, payment_method="Wompi")
  → firma: SHA256(reference + amount_cents + "USD" + INTEGRITY_KEY)
  → devuelve { wompiUrl, orderId }
    ↓
window.location.href = wompiUrl
    ↓
[checkout.wompi.pa — hosted checkout]
  Usuario paga con tarjeta o Clave
    ↓ redirect a redirect-url?id={wompi_transaction_id}
[/pago-wompi?id=...]
  → muestra estado al usuario (lee ?id= y llama a Wompi API para verificar)
    ↓ (en paralelo)
[POST /wompi/events — webhook]
  → recibe "transaction.updated" de Wompi
  → busca transaction en MongoDB por reference (= orderId)
  → APPROVED → status=2 | DECLINED/ERROR/VOIDED → status=0
```

### URL de checkout Wompi Panama
```
https://checkout.wompi.pa/p/?public-key={PUB_KEY}&currency=USD&amount-in-cents={cents}&reference={orderId}&redirect-url={FRONTEND}/pago-wompi&signature:integrity={sha256_hash}
```

### Firma de integridad (SHA256, se genera en el backend)
```python
import hashlib
s = f"{reference}{amount_in_cents}USD{WOMPI_INTEGRITY_KEY}"
integrity = hashlib.sha256(s.encode()).hexdigest()
```

### Estados finales del webhook (`transaction.updated`)
- `APPROVED` → `status: 2`
- `DECLINED` / `VOIDED` / `ERROR` → `status: 0`

---

## Archivos a crear / modificar

### Backend

**Nuevo: `server-py/routers/wompi.py`**
- `POST /wompi/checkout`:
  1. Recibe payload igual al de `/yappy/checkout` (userName, phone, email, products, total, etc.)
  2. Inserta transacción pendiente en MongoDB (`status: 1`, `payment_method: "Wompi"`)
  3. Genera firma SHA256 con `WOMPI_INTEGRITY_KEY`
  4. Devuelve `{ wompiUrl, orderId }`
- `POST /wompi/events` (webhook):
  1. Lee el evento JSON de Wompi
  2. Extrae `data.transaction.reference` (= nuestro `orderId`) y `data.transaction.status`
  3. Actualiza la transacción en MongoDB
  4. Devuelve HTTP 200

**Modificar: `server-py/main.py`**
- Añadir `from routers import wompi` y `app.include_router(wompi.router)`

**Variables de entorno Lambda (SAM) a añadir en `template.yaml`**
```
WOMPI_PUBLIC_KEY        # pub_test_... / pub_prod_...
WOMPI_PRIVATE_KEY       # prv_test_... / prv_prod_...
WOMPI_INTEGRITY_KEY     # test_integrity_... / prod_integrity_...
WOMPI_EVENTS_KEY        # test_events_... / prod_events_...
WOMPI_SANDBOX           # true / false
```

### Frontend — Cliente

**Modificar: `client/src/api/Cart.api.js`**
- Añadir `postWompiCheckoutRequest(data)` → `POST /wompi/checkout`

**Modificar: `client/src/components/PaymentModal.jsx`**
- Añadir `handleWompi(e)` handler (idéntico a `handleYappy` pero llamando `postWompiCheckoutRequest`)
- Añadir botón "Pagar con Wompi" visible en el formulario

**Nuevo: `client/src/Pages/WompiResult.jsx`**
- Lee `?id=` de la URL (ID de transacción de Wompi)
- Llama a `GET /wompi/status?id={id}` para verificar el estado
- Muestra UI de éxito o error + clearCart() si approved

**Modificar: `client/src/App.jsx`**
- Añadir `<Route path="/pago-wompi" element={<WompiResult />} />`

### Admin

**Modificar: `admin/src/components/finanzas/MovimientosCRUD.jsx`**
- Añadir `"Wompi"` a la constante `CHANNELS` en el selector de Canal de Acceso

---

## Configuración en el dashboard de Wompi

El usuario debe ir a **comercios.wompi.pa** y configurar:
1. **URL de eventos** → `https://api.royalepanama.com/wompi/events` (en Sandbox y Producción por separado)
2. **URL permitida de redirect** → `https://royalepanama.com/pago-wompi`

---

## Verificación / Testing

1. Sandbox: usar `pub_test_*` keys + tarjeta de prueba de la [documentación](https://docs.wompi.co/en/docs/panama/datos-de-prueba-en-sandbox/)
2. Flujo completo: agregar producto al carrito → checkout → formulario → clic "Pagar con Wompi" → redirige a `checkout.wompi.pa` → pagar con datos de prueba → redirige a `/pago-wompi?id=...` → estado visible
3. Verificar en MongoDB que la transacción cambia de `status: 1` a `status: 2`
4. Verificar en admin que aparece como "Wompi" en la columna de método de pago

---

## Prerrequisito (antes de iniciar el desarrollo)

El usuario aún no tiene cuenta Wompi. Debe:
1. Registrarse en **comercios.wompi.pa**
2. Obtener las 4 claves **sandbox** desde el dashboard:
   - `pub_test_...` → `WOMPI_PUBLIC_KEY`
   - `prv_test_...` → `WOMPI_PRIVATE_KEY`
   - `test_integrity_...` → `WOMPI_INTEGRITY_KEY`
   - `test_events_...` → `WOMPI_EVENTS_KEY`
3. Configurar en el dashboard de Wompi:
   - URL de eventos (sandbox): `https://api.royalepanama.com/wompi/events`
   - URL de redirect permitida: `https://royalepanama.com/pago-wompi`

**El código puede implementarse completamente ahora** con placeholders en las env vars. El botón solo aparece en el sitio si `WOMPI_PUBLIC_KEY` está configurada en Lambda.
