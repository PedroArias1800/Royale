# Plan: Tracking Automático de Canal de Acceso en Transacciones

## Contexto

El campo `channel` de una transacción era rellenado manualmente por el admin al procesar una venta. No había forma de saber automáticamente si el cliente llegó al sitio desde Instagram, un código QR, WhatsApp, Google, etc.

Se detecta el canal automáticamente cuando el usuario entra al sitio, se persiste durante la sesión de navegación (sessionStorage), y se guarda junto con la transacción al comprar. El endpoint `GET /api/analytics/breakdown?by=channel` ya existía y funciona — solo faltaba que el dato llegara desde el cliente.

---

## Mapping de canales

| Señal de entrada | Canal guardado |
|---|---|
| `?ref=instagram` / `?utm_source=instagram` | `"Instagram"` |
| `?ref=facebook` / `?utm_source=facebook` | `"Facebook"` |
| `?ref=qr` / `?utm_source=qr` | `"QR"` |
| `?ref=whatsapp` / `?utm_source=whatsapp` | `"WhatsApp"` |
| `?ref=google` / `?utm_source=google` | `"Google"` |
| `document.referrer` contiene `instagram.com` | `"Instagram"` |
| `document.referrer` contiene `facebook.com` / `fb.com` | `"Facebook"` |
| `document.referrer` contiene `google.` | `"Google"` |
| `document.referrer` es el propio dominio | `"Sitio Web"` |
| Sin params ni referrer | `"Directo"` |

**Links para publicaciones:**
- Instagram: `https://royalepanama.com?ref=instagram`
- Facebook: `https://royalepanama.com?ref=facebook`
- Tarjetas QR físicas: `https://royalepanama.com?ref=qr`
- WhatsApp broadcast: `https://royalepanama.com?ref=whatsapp`

---

## Archivos modificados

| Archivo | Cambio |
|---|---|
| `client/src/context/ParfumContext.jsx` | `detectChannel()` + estado `channelSource` en sessionStorage |
| `client/src/components/CartResume.jsx` | Incluye `channel: channelSource` en objeto transaction |
| `server-py/routers/public.py` | Campo `channel` en `TransactionBody` y en el doc guardado |
| `admin/src/components/finanzas/MovimientosCRUD.jsx` | Nuevas opciones: Facebook, QR, Google, Directo |

---

## Decisiones técnicas

- **`sessionStorage` (no `localStorage`):** El canal es por visita. Un nuevo tab = nueva detección de canal. localStorage acumularía el canal de visitas previas.
- **Lazy initializer de `useState`:** La detección corre síncronamente en el primer render del provider, sin necesidad de `useEffect`. Mismo patrón que el carrito.
- **Prioridad:** URL params > sessionStorage guardado > referrer > directo. Si el usuario navega entre páginas sin params, el canal original se preserva.
- **Analytics sin cambios:** `analytics.py` ya filtra `channel: {$exists: True, $ne: ""}` — los documentos históricos sin canal simplemente no aparecen en el breakdown.
