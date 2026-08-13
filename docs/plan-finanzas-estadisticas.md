# Plan: Módulo de Finanzas y Estadísticas — Admin Royale

## Contexto

Royale Panama usaba la app **Treinta** (de pago) para llevar contabilidad e inventario. Se replicó esa funcionalidad directamente en el admin para eliminar ese costo recurrente. El modelo central es **`transactions`** — única fuente de verdad para todos los eventos financieros.

---

## Arquitectura de la Solución

### Modelo `transactions` (extendido)

Las transacciones del checkout del cliente se crean automáticamente con `status=1` (pendiente). El admin las procesa desde la pestaña **Pendientes**, completando los campos de metadata. Una vez marcadas como `status=2` (completadas), se contabilizan en las estadísticas.

**Nuevos campos añadidos:**

| Campo | Tipo | Descripción |
|---|---|---|
| `payment_method` | string | Efectivo / Transferencia / Yappy / Tarjeta / Otro |
| `delivery_method` | string | Pickup / Delivery propio / Mensajería / Digital |
| `channel` | string | Sitio Web / WhatsApp / Instagram / Vendedor / Otro |
| `label` | string | Etiqueta financiera (Venta Directa, Abono, etc.) |
| `description` | string | Notas libres del admin |
| `fin_type` | string | `"ingreso"` \| `"salida"` — solo en entradas manuales |
| `is_manual` | bool | `true` solo en entradas creadas manualmente por el admin |

### Etiquetas predefinidas

| Tipo | Etiquetas |
|---|---|
| Ingreso | "Venta Directa", "Abono", "Devolución recibida", "Otro ingreso" |
| Salida | "Costo del Producto", "Gastos Operativos", "Merma", "Publicidad y Marketing", "Envíos y Logística", "Devolución emitida", "Otro gasto" |

### Nuevos campos añadidos (fase 2)

| Campo | Tipo | Descripción |
|---|---|---|
| `omitted` | bool | `true` = excluida de estadísticas (no se elimina) |

### Flujo de datos

```
Cliente hace compra
  → transaction {status: 1, is_manual: false}
  → aparece en pestaña Pendientes

Admin procesa
  → PUT /api/transactions/{id}
  → rellena payment_method, delivery_method, channel, label, description
  → status: 2
  → aparece en pestaña Procesadas

Admin puede:
  → Omitir: PUT {omitted: true}  — excluye de estadísticas sin eliminar
  → Revertir: PUT {status: 1}    — vuelve a Pendientes
  → Toggle omitir desde Procesadas sin perder la transacción

Analytics cuenta solo status=2 AND omitted≠true
  → Ingresos = ventas completadas + ingresos manuales (fin_type=ingreso)
  → Salidas = entradas manuales (fin_type=salida, is_manual=true)
  → COGS calculado de types.cost × quantities
```

---

## Endpoints del Backend

### Transacciones (extendido)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/transactions/pending` | Pendientes del checkout (status=1, is_manual≠true) |
| GET | `/api/transactions/processed?start=&end=` | Procesadas del checkout (status=2, is_manual≠true) |
| GET | `/api/transactions/manual?start=&end=` | Entradas manuales del admin |
| POST | `/api/transactions/manual` | Crear entrada manual (gasto, abono, etc.) |
| PUT | `/api/transactions/{id}` | Actualizar metadatos + status + omitted |
| DELETE | `/api/transactions/{id}` | Solo elimina entradas is_manual=true |

### Analytics

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/analytics/summary?start=&end=` | KPIs: ingresos, salidas, balance, margen bruto |
| GET | `/api/analytics/trends?start=&end=&granularity=day\|week\|month` | Serie temporal |
| GET | `/api/analytics/breakdown?start=&end=&by=label\|payment\|delivery\|channel\|seller` | Desglose categórico |

> `movements.py` queda como archivo de referencia pero no está registrado en `main.py`.

---

## Página `/finanzas`

```
/finanzas
├── PeriodPicker          — Hoy / Semana / Mes / Año / Personalizado
├── KpiCards (4 tarjetas) — Ingresos | Salidas | Balance | Margen Bruto
├── ChartTendencia        — LineChart (ingresos vs salidas por período)
├── ChartDesglose         — PieChart (desglose por etiqueta)
├── ChartMetodos          — BarChart con tabs (pago / entrega / canal / vendedor)
└── MovimientosCRUD
    ├── Pestaña Pendientes  — transacciones del checkout esperando procesado
    ├── Pestaña Procesadas  — status=2 con opciones Revertir y Omitir
    └── Pestaña Manuales    — gastos/ingresos creados manualmente
```

### Lógica de estadísticas

- **Ingresos** = `transactions` con `status=2` Y (`fin_type` no existe O `fin_type=ingreso`)
- **COGS** = `types.cost × quantities` de ventas completadas (calculado en Python)
- **Salidas manuales** = `transactions` con `fin_type=salida` Y `is_manual=true`
- **Balance** = Ingresos − COGS − Salidas manuales
- **Margen bruto** = (Ingresos ventas − COGS) / Ingresos ventas × 100

---

## Archivos Modificados/Creados

| Archivo | Estado |
|---|---|
| `server-py/routers/transactions.py` | Modificado — nuevos campos, endpoints pending/manual |
| `server-py/routers/analytics.py` | Creado — 3 endpoints sobre transactions |
| `server-py/routers/movements.py` | Creado pero **no registrado** (referencia) |
| `server-py/main.py` | Modificado — registra analytics, no movements |
| `admin/src/api/Transaction.api.js` | Modificado — 4 nuevas funciones |
| `admin/src/Pages/Finanzas.jsx` | Creado |
| `admin/src/components/finanzas/PeriodPicker.jsx` | Creado |
| `admin/src/components/finanzas/KpiCards.jsx` | Creado |
| `admin/src/components/finanzas/ChartTendencia.jsx` | Creado |
| `admin/src/components/finanzas/ChartDesglose.jsx` | Creado |
| `admin/src/components/finanzas/ChartMetodos.jsx` | Creado |
| `admin/src/components/finanzas/MovimientosCRUD.jsx` | Creado — tabs Pendientes y Manuales |
| `admin/src/css/Finanzas.css` | Creado |
| `admin/src/components/ModalFormTransaction.jsx` | Modificado — label, description, 3 selects |
| `admin/src/Pages/Admin.jsx` | Modificado — link /finanzas (rol 1) |
| `admin/src/App.jsx` | Modificado — ruta /finanzas |

---

## Paleta Visual

- **Ingresos**: `#2ecc71` (verde)
- **Salidas**: `#d60a5f` (crimson del sistema)
- **Balance**: `#fdd05e` (dorado del sistema)
- **Margen**: `#a78bfa` (violeta suave)
- Fondo de gráficos: transparente sobre dark theme del admin
