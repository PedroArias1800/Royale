# Arquitectura del Sistema — Royale Panama

> **Última actualización:** 2026-06-19
> Este documento se mantiene sincronizado con cada cambio arquitectónico del proyecto.

---

## Visión general

Royale es una plataforma de e-commerce para la venta de perfumes. Está compuesta por tres aplicaciones independientes desplegadas en AWS.

```
┌─────────────────────────────────────────────────────────────────┐
│                        USUARIO FINAL                            │
└──────────────┬──────────────────────────────┬───────────────────┘
               │                              │
    royalepanama.com               admin.royalepanama.com
               │                              │
       ┌───────▼──────┐              ┌────────▼─────┐
       │  CloudFront  │              │  CloudFront  │
       │  (CDN + SSL) │              │  (CDN + SSL) │
       └───────┬──────┘              └────────┬─────┘
               │                              │
       ┌───────▼──────┐              ┌────────▼─────┐
       │  S3 Bucket   │              │  S3 Bucket   │
       │ client/dist  │              │ admin/dist   │
       └──────────────┘              └──────────────┘
                              │
                    api.royalepanama.com
                              │
                   ┌──────────▼─────────┐
                   │   API Gateway      │
                   │   HTTP API (v2)    │
                   └──────────┬─────────┘
                              │
                   ┌──────────▼─────────┐
                   │   AWS Lambda       │
                   │   Python 3.12      │
                   │   FastAPI + Mangum │
                   └──┬─────────────┬───┘
                      │             │
           ┌──────────▼──┐   ┌──────▼──────────┐
           │ MongoDB      │   │   S3 Bucket     │
           │ Atlas M0     │   │  royale-media   │
           │ (gratuito)   │   │  (imágenes)     │
           └─────────────┘   └─────────────────┘
```

---

## Componentes

### 1. Cliente (`client/`) — Tienda pública

| Propiedad | Valor |
|---|---|
| Framework | React 18 + Vite 6 |
| Tipo | SPA (Single Page Application) |
| Hosting prod | S3 `royale-client-dist` + CloudFront |
| Hosting staging | S3 `royale-client-staging` + CloudFront |
| Dominio prod | https://royalepanama.com |
| Dominio staging | https://xxxx.cloudfront.net (URL por defecto) |
| Variables de entorno | `VITE_SERVER_URL`, `VITE_FRONTEND_URL` |

**Páginas:** Index, Search (con paginación, 12/página), ParfumDetails, Cart

**Componentes principales del cliente:**
- `Header` — overlay fullscreen mobile + `CartDrawer` integrado
- `CartDrawer` — panel lateral slide-in desde la derecha; fetch al abrir
- `CartSummary` / `CartResume` — tarjetas producto + resumen pedido en `/cart`
- `MasBuscadosHome` — carrusel multi-item (hasta 11 + tarjeta "ver más")
- `MasBuscados` — carrusel genérico (Ventas Flash, Search)
- `ParfumInfo` — detalle de parfum con precio prominente y badge flash
- `Alert` — toast bottom-right con barra de progreso

**Estado:** Cart en `localStorage` (persiste sin servidor). Filtros y alertas en `ParfumContext`.

**Sistema visual:** Art Deco Noir Luxe — fondo `#080409`, dorado `#fdd05e`, crimson `#d60a5f`, fuentes Cinzel / Playfair Display / Raleway.

---

### 2. Admin (`admin/`) — Dashboard interno

| Propiedad | Valor |
|---|---|
| Framework | React 18 + Vite 6 |
| Tipo | SPA protegida con JWT cookie |
| Hosting prod | S3 `royale-admin-dist` + CloudFront |
| Hosting staging | S3 `royale-admin-staging` + CloudFront |
| Dominio prod | https://admin.royalepanama.com |
| Dominio staging | https://xxxx.cloudfront.net (URL por defecto) |

**Páginas:** Login, Register, Admin (dashboard), Data (tablas CRUD)

**Estado central:** `AuthProvider` — concentra autenticación, operaciones CRUD, paginación y estado de modales.

---

### 3. API (`server-py/`) — Backend

| Propiedad | Valor |
|---|---|
| Lenguaje | Python 3.12 |
| Framework | FastAPI + Mangum (adaptador Lambda) |
| Hosting prod | AWS Lambda `royale-api-prod` |
| Hosting staging | AWS Lambda `royale-api-staging` |
| Dominio prod | https://api.royalepanama.com |
| Dominio staging | URL autogenerada por API Gateway |
| Deploy tool | AWS SAM (template.yaml) |

**Entidades CRUD:** parfum, brand, type, body, version, promotion, coupon, transaction, user

---

### 4. Base de datos — MongoDB Atlas M0

| Propiedad | Valor |
|---|---|
| Proveedor | MongoDB Atlas |
| Plan | M0 (gratuito para siempre, 512MB) |
| Base prod | `royale` |
| Base staging | `royale-staging` |
| Colecciones | parfums, brands, types, bodies, versions, promotions, coupons, transactions, users, images |
| Connection | Variable de entorno `MONGODB_URI` |

**Datos actuales:** 235 documentos en 10 colecciones (importados desde `bd/backup/json/`).

---

### 5. Almacenamiento de medios — S3

| Propiedad | Valor |
|---|---|
| Bucket prod | `royale-media` |
| Bucket staging | `royale-media-staging` |
| Región | us-east-1 |
| Acceso | Público de lectura (imágenes accesibles por URL directa) |
| Carpetas | `body/`, `parfumIcon/`, `promotion/` |
| Archivos actuales | 128 archivos, 23MB |

Las URLs de las imágenes se almacenan directamente en MongoDB con el formato:
```
https://royale-media.s3.us-east-1.amazonaws.com/parfumIcon/1737474035257-archivo.webp
```

---

## Entornos

### Staging (pruebas)
- API: stack SAM `royale-api-staging`
- DB: Atlas `royale-staging`
- Media: S3 `royale-media-staging`
- Frontends: S3 + CloudFront sin dominio personalizado
- Propósito: validar cambios antes de ir a producción

### Producción
- API: stack SAM `royale-api-prod`
- DB: Atlas `royale`
- Media: S3 `royale-media`
- Frontends: dominios `royalepanama.com` y `admin.royalepanama.com`

---

## AWS — Cuenta y servicios usados

| Dato | Valor |
|---|---|
| Cuenta | RoyalePanama |
| Account ID | 011939520585 |
| Perfil AWS CLI | `RoyalePanama` |
| Región principal | us-east-1 |

| Servicio | Uso | Costo |
|---|---|---|
| Lambda | Ejecución de la API Python | Free tier: 1M req/mes |
| API Gateway HTTP API | Enrutamiento HTTP → Lambda | Free tier: 1M req/mes × 12 meses |
| S3 | Medios + builds de frontends | Free tier: 5GB |
| CloudFront | CDN para frontends | Free tier: 1TB/mes |
| ACM | Certificados SSL | Siempre gratis |
| EventBridge | Keep-warm cada 5 min | Free tier: 1M eventos/mes |

---

## Flujo de autenticación

```
Admin (navegador)
    │
    ├─ POST /api/login ──────────────────► Lambda
    │                                          │
    │                                     Verifica email/password con bcrypt
    │                                     Crea JWT (expira en 1 día)
    │                                          │
    ◄── Cookie httpOnly "token" ───────────────┘
    │   (dominio: .royalepanama.com, secure, sameSite: none)
    │
    ├─ Cada request protegido ──────────► Lambda
    │   Cookie se envía automáticamente      │
    │                                     Verifica JWT con PyJWT
    │                                          │
    ◄── Datos o 401 ───────────────────────────┘
```

---

## Flujo de subida de imágenes

```
Admin sube imagen
    │
    ├─ POST /api/body (multipart/form-data) ──► Lambda
    │                                              │
    │                                         boto3.put_object() → S3 royale-media
    │                                         Construye URL pública S3
    │                                         Guarda URL en MongoDB Atlas
    │                                              │
    ◄── Documento con URL S3 ──────────────────────┘

Cliente carga página
    │
    ├─ GET /parfums ────────────────────────► Lambda → MongoDB
    │                                              │
    ◄── JSON con URLs S3 de imágenes ─────────────┘
    │
    ├─ <img src="https://royale-media.s3..."> ──► S3 (directo, sin pasar por Lambda)
```

---

## Estructura del repositorio

```
Royale/
├── client/          ← Tienda React (SPA)
├── admin/           ← Dashboard React (SPA)
├── server/          ← API Express original (Node.js) — OBSOLETO
├── server-py/       ← API Python FastAPI — ACTIVO
│   ├── main.py
│   ├── database.py
│   ├── auth.py
│   ├── storage.py
│   ├── helpers.py
│   ├── routers/     ← Un archivo por entidad
│   ├── requirements.txt
│   ├── template.yaml   ← AWS SAM config (prod + staging)
│   ├── samconfig.toml  ← Parámetros guardados por sam deploy
│   └── DEPLOY.md    ← Guía de comandos de deploy
├── bd/
│   └── backup/json/ ← Backup de los 235 documentos MongoDB
└── docs/
    ├── plan-aws-migration.md  ← Resumen ejecutivo del plan
    └── arquitectura.md        ← Este archivo
```

---

## Variables de entorno

### API Lambda (`server-py/.env` local / SAM Parameters en producción)

| Variable | Descripción |
|---|---|
| `MONGODB_URI` | Connection string de MongoDB Atlas |
| `JWT_SECRET` | Secreto para firmar tokens JWT |
| `S3_MEDIA_BUCKET` | Nombre del bucket S3 de medios |
| `AWS_REGION` | Región AWS (us-east-1) |
| `FRONTEND_URL` | URL del cliente (para CORS) |
| `ADMIN_URL` | URL del admin (para CORS) |

### Frontends (`client/.env` y `admin/.env`)

| Variable | Descripción |
|---|---|
| `VITE_SERVER_URL` | URL base de la API |
| `VITE_FRONTEND_URL` | URL del cliente |

---

## Endpoints de la API

### Públicos (sin autenticación)
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/parfums?type=Normal` | Lista perfumes activos con tipos y marcas |
| GET | `/parfum?id=<id>` | Detalle de un perfume con sus tipos |
| GET | `/parfums/body` | Fondos de pantalla activos |
| GET | `/promotions` | Promociones activas |
| GET | `/cupon?id=<code>` | Validar cupón por código |
| POST | `/transaction` | Crear orden de compra |
| PUT | `/transaction/:id` | Marcar transacción como atendida |

### Protegidos (requieren cookie JWT)
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/login` | Iniciar sesión |
| POST | `/api/logout` | Cerrar sesión |
| GET | `/api/verify` | Verificar token activo |
| GET | `/api/profile` | Datos del usuario logueado |
| GET/POST/PUT/DELETE | `/api/parfum(s)` | CRUD perfumes |
| GET/POST/PUT/DELETE | `/api/brand(s)` | CRUD marcas |
| GET/POST/PUT/DELETE | `/api/type(s)` | CRUD tipos (con upload de iconos) |
| GET/POST/PUT/DELETE | `/api/bod(y/ies)` | CRUD fondos (con upload de imágenes) |
| GET/POST/PUT/DELETE | `/api/version(s)` | CRUD versiones |
| GET/POST/PUT/DELETE | `/api/promotion(s)` | CRUD promociones (con upload de media) |
| GET/POST/PUT/DELETE | `/api/coupon(s)` | CRUD cupones |
| GET/POST | `/api/transaction(s)` | CRUD transacciones + export XLSX |
| GET/POST/PUT | `/api/user(s)` | CRUD usuarios |
| GET | `/transaction` | Transacciones pendientes |
