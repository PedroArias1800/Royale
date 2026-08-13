# Plan: Módulo de Descuentos por Métricas

## Contexto

Se necesita un sistema de descuentos configurables por el admin basados en atributos de los parfums (marca, género, rango de precio, fecha de creación). Antes de guardar un descuento, el admin ve en tiempo real cuántos y cuáles parfums aplican. En el sitio del cliente se agrega una página `/descuentos` donde cada regla activa se muestra como una sección con sus parfums en carrusel, precio tachado y precio con descuento destacado.

**Diferencia con mecanismos existentes:**
- `coupons` → código que ingresa el usuario al checkout
- `promotions` → banners de imagen/video sin lógica de precio
- `discount_rules` (nuevo) → regla de marketing que filtra parfums por métrica y les asigna un % de descuento visual en una página dedicada

---

## Colección MongoDB: `discount_rules`

```json
{
  "_id": ObjectId,
  "title": "Recién Llegados",
  "description": "Parfums incorporados en los últimos 30 días",
  "discount_pct": 15.0,
  "status": 1,
  "filter_brand_ids": ["ObjectId", ...],
  "filter_gender": null,
  "filter_price_min": null,
  "filter_price_max": null,
  "filter_created_after": null,
  "filter_created_before": null,
  "order_index": 0,
  "schedule_enabled": false,
  "schedule_start": null,
  "schedule_end": null,
  "createdAt": DateTime,
  "updatedAt": DateTime
}
```

**Lógica de matching:** un parfum aplica si cumple **todos** los criterios no-nulos. El precio descuento se calcula en runtime (`type.price * (1 - discount_pct/100)`), no se persiste.

---

## Programación de Activación (`schedule`)

El campo `status` deja de ser el único control de visibilidad. Se añade un bloque `schedule` opcional:

```json
{
  "schedule_enabled": true,
  "schedule_start": "2025-08-01T00:00:00Z",
  "schedule_end":   "2025-08-31T23:59:59Z"
}
```

**Modos de programación (UI del admin):**

| Modo | Descripción | Campos generados |
|---|---|---|
| Sin programación | Solo depende de `status` manual | `schedule_enabled: false` |
| Día específico | Activa ese día completo (00:00 → 23:59) | `start` y `end` del mismo día |
| Rango de fechas | Fecha inicio y fecha fin personalizadas | `start` y `end` libres |
| Una semana | 7 días desde la fecha inicio | `start`, `end = start + 6d 23:59` |
| Un mes | Mes calendario desde la fecha inicio | `start`, `end = último día del mes 23:59` |

**Lógica de visibilidad en el endpoint `/discounts/public`:**

Una regla es visible si:
1. `status == 1`, **Y**
2. Si `schedule_enabled == false` → siempre visible
3. Si `schedule_enabled == true` → visible solo si `now >= schedule_start AND now <= schedule_end`

Esto se evalúa en el backend en cada request; no hay tarea cron ni campo adicional que actualizar.

---

## Fase 1 — Backend (`server-py/`)

**Crear** `server-py/routers/discounts.py`:

| Endpoint | Auth | Descripción |
|---|---|---|
| `GET /api/discounts` | ✓ | Listado paginado |
| `POST /api/discounts` | ✓ | Crear regla |
| `PUT /api/discounts/{id}` | ✓ | Actualizar |
| `DELETE /api/discounts/{id}` | ✓ | Eliminar |
| `POST /api/discounts/preview` | ✓ | Retorna `{ count, parfums[] }` que aplican según filtros del body (para preview admin en tiempo real) |
| `POST /api/discounts/filtered` | ✓ | Busca reglas por texto |
| `GET /discounts/public` | ✗ | Reglas activas con sus parfums y `price_discounted` calculado, ordenadas por `order_index` |

**Modificar** `server-py/main.py`: `from routers import ... discounts` + `app.include_router(discounts.router)`

---

## Fase 2 — Admin Frontend

**Crear** `admin/src/api/Discounts.api.js` — 6 funciones axios (get, post, put, delete, preview, filtered)

**Crear** `admin/src/pages/Descuentos.jsx` — página standalone idéntica al patrón de `Delivery.jsx`:
- Estado local: `data`, `pagination`, `page`, `filterText`, `modal`, `loading`
- Tabla: Nombre | Descuento % | Métricas activas (badges) | Parfums (contador) | Programación | Estado
- Badges por métrica activa: Marca (dorado), Género (azul), Precio (verde), Fecha (morado)
- Columna Programación: "Sin fecha" / "Activo hasta DD/MM" / "Inicia el DD/MM" / badge rojo "Vencido"
- Click fila → `<ModalFormDiscount item={row} />`

**Crear** `admin/src/components/ModalFormDiscount.jsx`:

Secciones:
1. **Info básica**: título, descripción, `discount_pct` (%), estado, `order_index`
2. **Criterios de filtrado** (todos opcionales):
   - Marca: multi-select checkbox (carga marcas con `getBrandsRequest`)
   - Género: select Todos / Damas / Caballeros
   - Rango de precio: inputs min/max USD
   - Rango de fecha de creación: date inputs "desde / hasta"
3. **Programación** (toggle `schedule_enabled`):
   - Toggle "Activar programación automática"
   - Cuando activo, aparece selector de **modo**:
     - *Sin fin* — solo fecha inicio (activa desde ese día indefinidamente)
     - *Día específico* — un date picker, genera start 00:00 y end 23:59 del mismo día
     - *Rango libre* — date picker inicio + date picker fin
     - *Una semana* — date picker inicio, end se calcula automáticamente (+6d 23:59)
     - *Un mes* — date picker inicio, end = último día del mes 23:59
   - Muestra resumen textual: "Activo del 1 ago al 31 ago 2025"
   - Si `schedule_enabled` está activo pero las fechas ya pasaron, mostrar badge de advertencia "Programación vencida" en la tabla
4. **Preview en tiempo real** (debounce 400ms con `useEffect` sobre filtros):
   - Llama `postDiscountPreviewRequest(filters)`
   - Muestra: `N parfums aplican` en dorado + grid de miniaturas (img + título + precio original → precio descuento)
   - Estados: cargando (spinner) / vacío ("Ningún parfum coincide")

**Crear** `admin/src/css/Descuentos.css` — badges `.ds-badge-*`, grid de preview `.ds-preview-grid`, tarjeta miniatura `.ds-preview-card`, badge de programación `.ds-schedule-badge` (dorado cuando activo y vigente, gris cuando vencido, rojo si `status=1` pero sin schedule activo)

**Modificar** `admin/src/App.jsx`: + `<Route path="/descuentos" element={<Descuentos />} />`

**Modificar** `admin/src/pages/Admin.jsx` (bloque `user.rol==1`): + `<Link to="/descuentos">Descuentos</Link>`

---

## Fase 3 — Cliente Frontend

**Crear** `client/src/api/Discounts.api.js`:
```js
export const getDiscountsPublicRequest = async () => axios.get(`${URL}/discounts/public`)
```

**Crear** `client/src/Pages/Descuentos.jsx`:
- Carga `getDiscountsPublicRequest()` al montar
- Estado vacío: ilustración + link a `/search`
- Por cada regla activa → sección con:
  - Header: título + badge `−X%` crimson
  - Descripción opcional
  - Carrusel horizontal (scroll-snap, mismas clases que `MasBuscados`) de `<DiscountCard>`
- `<DiscountCard>` (componente interno): imagen, brand + title, precio original tachado gris, precio descuento en dorado/Playfair Display, ml, link `/parfum?id=...&type=...`

**Crear** `client/src/css/Descuentos.css`:
- `.desc-page`, `.desc-hero` (título art deco con Cinzel)
- `.desc-section`, `.desc-section__header`, `.desc-pct-badge` (crimson gradient)
- `.desc-carousel` (`overflow-x: auto; scroll-snap-type: x mandatory`)
- `.desc-card`, `.desc-card__price-old` (tachado), `.desc-card__price-new` (dorado, Playfair)

**Modificar** `client/src/App.jsx`: + `<Route path="/descuentos" element={<Descuentos />} />`

**Modificar** `client/src/components/Header.jsx`:
- Desktop nav: añadir `<Link to="/descuentos">% Descuentos</Link>` entre Caballeros y Mi cesta
- Mobile overlay: añadir link `04 Descuentos`, correr Mi Cesta a `05`

---

## Archivos

| Archivo | Acción |
|---|---|
| `server-py/routers/discounts.py` | Crear |
| `server-py/main.py` | + import + include_router |
| `admin/src/api/Discounts.api.js` | Crear |
| `admin/src/pages/Descuentos.jsx` | Crear |
| `admin/src/components/ModalFormDiscount.jsx` | Crear |
| `admin/src/css/Descuentos.css` | Crear |
| `admin/src/App.jsx` | + ruta /descuentos |
| `admin/src/pages/Admin.jsx` | + link Descuentos (rol=1) |
| `client/src/api/Discounts.api.js` | Crear |
| `client/src/Pages/Descuentos.jsx` | Crear |
| `client/src/css/Descuentos.css` | Crear |
| `client/src/App.jsx` | + ruta /descuentos |
| `client/src/components/Header.jsx` | + link nav desktop y mobile overlay |

---

## Verificación

1. `uvicorn main:app --reload` → `/docs` → `POST /api/discounts/preview` con distintos filtros → verificar que el conteo varía
2. Admin: crear "Recién Llegados" con filtro de fecha y preview en tiempo real → guardar → contador correcto en tabla
3. Admin: editar regla, cambiar género → preview se actualiza automáticamente (debounce 400ms)
4. Admin: crear regla con programación "Día específico" = hoy → verificar que aparece en `/discounts/public`; cambiar a mañana → ya no aparece
5. Admin: crear regla con "Rango libre" pasado → tabla muestra badge "Vencido"; no aparece en cliente
6. Admin: crear regla con "Un mes" a partir de hoy → resumen textual correcto en modal + aparece en cliente durante el mes
7. Cliente: `/descuentos` → secciones con precios tachados y descuento calculado correcto; orden según `order_index`
8. Reglas `status=0` no aparecen en cliente independientemente de la programación
9. `npm run build` en admin y client sin errores
