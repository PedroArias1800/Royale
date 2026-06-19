# CLAUDE.md

Este archivo proporciona orientación a Claude Code (claude.ai/code) cuando trabaja con el código de este repositorio.

## Descripción del Proyecto

**Royale** es una plataforma de e-commerce full-stack para perfumes (parfums). Es un monorepo con tres aplicaciones independientes: un backend Python/FastAPI en AWS Lambda, una tienda React para clientes, y un dashboard React para administradores.

- **API en producción**: https://api.royalepanama.com (AWS Lambda + API Gateway)
- **Cliente**: https://royalepanama.com (S3 + CloudFront)
- **Admin**: https://admin.royalepanama.com (S3 + CloudFront)
- **Medios**: https://royale-media.s3.us-east-1.amazonaws.com (S3 público)

## Comandos de Desarrollo

Cada aplicación debe iniciarse de forma independiente:

```bash
# Servidor (FastAPI local, puerto 8000)
cd server-py && uvicorn main:app --reload

# Tienda cliente (puerto 5173)
cd client && npm run dev
cd client && npm run host       # exponer en la red local

# Dashboard admin (puerto 5174)
cd admin && npm run dev

# Build para producción
cd client && npm run build
cd admin && npm run build

# Linting
cd client && npm run lint
cd admin && npm run lint
```

## Deploy a Producción

```bash
# 1. Build
cd client && npm run build

# 2. Subir a S3 (solo perfil RoyalePanama — NUNCA tocar otros perfiles SSO)
aws s3 sync dist/ s3://royale-client --delete --profile RoyalePanama

# 3. Invalidar caché CloudFront
aws cloudfront create-invalidation --distribution-id EZHK0H0CPXIO4 --paths "/*" --profile RoyalePanama

# API: ver server-py/DEPLOY.md para instrucciones de sam deploy
```

**CRÍTICO**: Usar SIEMPRE `--profile RoyalePanama`. Nunca modificar los perfiles SSO `default`, `PS-PlayDigital` ni `MediosDePago`.

## Arquitectura

### Stack
- **Backend**: Python 3.12, FastAPI, Mangum (adaptador Lambda), PyMongo, PyJWT
- **Base de datos**: MongoDB Atlas M0 (free, 512MB) — colección `royale`
- **Medios**: S3 `royale-media` — imágenes subidas por el admin, URLs completas guardadas en Atlas
- **Autenticación**: JWT en cookies HTTP-only; `server-py/auth.py` protege las rutas con dependency injection de FastAPI
- **Frontend**: React 18 + Vite 6 + react-router-dom v7
- **Estado del admin**: un único contexto `AuthProvider` (`admin/src/context/AuthProvider.jsx`) que concentra autenticación, todas las operaciones CRUD, paginación, filtros y estado de modales
- **Estado del cliente**: `ParfumContext` (`client/src/context/ParfumContext.jsx`) gestiona el carrito (persistido en localStorage), filtros y alertas

### Flujo de Datos
Todas las llamadas a la API pasan por archivos por entidad en `[app]/src/api/`. El servidor expone rutas RESTful bajo `/api/{entidad}`. Las imágenes van a S3 via boto3 y sus URLs se guardan en MongoDB.

### Entidades Principales
`parfum`, `brand`, `type`, `body`, `version`, `promotion`, `coupon`, `transaction`, `user`, `image`

### Patrón de UI del Admin
El CRUD de cada entidad sigue el mismo patrón: el componente `DataTable` renderiza las filas, y al hacer clic en las acciones se abre un componente `ModalForm{Entidad}` (en `admin/src/components/`). Todo el estado de los modales vive en `AuthProvider`.

### Componentes clave del cliente

| Componente | Descripción |
|---|---|
| `Header.jsx` | Nav con `CartDrawer` integrado. Estado: `menuOpen`, `cartOpen`. Overlay fullscreen en mobile. |
| `CartDrawer.jsx` | Panel lateral desde la derecha (460px). Fetch al abrir, actualizaciones locales sin re-fetch. |
| `CartSummary.jsx` | Tarjeta de producto en `/cart` — clases `pc-card`. Con modal de confirmación de eliminación. |
| `CartResume.jsx` | Resumen de pedido en `/cart` — clases `cr-*`. Cupón, totales, botón compra. |
| `MasBuscadosHome.jsx` | Carrusel de hasta 11 parfums + tarjeta "ver más" → `/search`. Auto-avance cada 3.5s. |
| `MasBuscados.jsx` | Carrusel genérico reutilizado en Ventas Flash y `/search`. |
| `ParfumInfo.jsx` | Detalle de parfum en `/parfum?id=`. Precio prominente, badge flash, separador ornamental. |
| `Alert.jsx` | Toast bottom-right. Fondo oscuro (#0e080c), borde izquierdo dorado/crimson, barra de progreso. |

### Diseño Visual — Art Deco Noir Luxe

| Variable | Valor |
|---|---|
| Fondo base | `#080409` |
| Dorado | `#fdd05e` |
| Crimson | `#d60a5f` |
| Fuentes | Cinzel (headings), Playfair Display (display), Raleway (body) |

**Regla crítica de imágenes flash**: La clase `demo animated` crea bordes animados via `background-origin: border-box`. Aplicarla directamente a `<img>` produce ruido estático de colores. **Siempre** aplicarla a un `<div>` contenedor con `border: 6px solid transparent`.

### Helper `imgSrc`
```js
(path) => (!path || path.startsWith('http')) ? path : `${URLServer}${path}`
```
Maneja URLs completas de S3 y paths relativos del servidor legado.

### Variables de Entorno
- **Frontends**: `VITE_SERVER_URL` (URL de la API) y `VITE_FRONTEND_URL`
- **API Lambda**: `MONGODB_URI`, `JWT_SECRET`, `S3_MEDIA_BUCKET`, `FRONTEND_URL`, `ADMIN_URL`
- Configuración centralizada en `server-py/main.py` y SAM parameters

## Notas Arquitectónicas Importantes

- **Socket.io** estaba instalado en el servidor Node legado pero está comentado — no se migró a Python.
- El `AuthProvider` del admin es intencionalmente grande: centraliza todas las llamadas al servidor y el estado compartido para evitar prop drilling.
- El estado del carrito persiste entre sesiones mediante `localStorage`; no existe almacenamiento del carrito en el servidor.
- La exportación XLSX de transacciones está disponible desde la API Python (`/api/transactions/export`).
- El directorio `server/` (Node/Express) es el backend **original/obsoleto** — se mantiene como referencia pero no está desplegado. El backend activo es `server-py/`.
- `bd/backup/json/` contiene los 235 documentos originales de MongoDB (ya importados a Atlas).
