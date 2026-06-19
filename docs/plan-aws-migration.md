# Plan: Migración de Royale a AWS — Resumen Ejecutivo

## ¿Por qué migramos?

La VPS de Hostinger costó ~$140/año para pocas visitas. AWS tiene capas gratuitas que reducen ese costo a **$0 el primer año** y **menos de $60/año a partir del segundo**, con escalabilidad automática.

---

## Arquitectura final

```
royalepanama.com          →  CloudFront  →  S3 (client/dist)
admin.royalepanama.com    →  CloudFront  →  S3 (admin/dist)
api.royalepanama.com      →  API Gateway HTTP API (v2)
                          →  AWS Lambda (Python 3.12 + FastAPI)
                                    →  MongoDB Atlas M0 (gratis siempre)
                                    →  S3 royale-media (imágenes/videos)
DNS                       →  Registrador actual del dominio (sin Route 53)
SSL                       →  ACM (gratis) en CloudFront y API Gateway
```

---

## Costo estimado

| Servicio | Free Tier | Año 1 | Año 2+ |
|---|---|---|---|
| Lambda | 1M req/mes (siempre gratis) | $0 | $0 |
| API Gateway HTTP API | 1M req/mes × 12 meses | $0 | ~$1/millón req |
| S3 (media + statics) | 5GB (siempre gratis) | $0 | < $0.25/mes |
| CloudFront | 1TB/mes (siempre gratis) | $0 | $0 |
| ACM (SSL) | Siempre gratis | $0 | $0 |
| MongoDB Atlas M0 | 512MB (siempre gratis) | $0 | $0 |
| **TOTAL** | | **$0** | **~$0–5/mes** |

---

## Qué cambiamos y qué no

### Cambiamos
- **API**: Express (Node.js) → **Python 3.12 + FastAPI + Mangum** (ya reescrita en `server-py/`)
- **Hosting API**: servidor VPS → **AWS Lambda** (sin servidor que gestionar)
- **Imágenes**: carpeta `server/uploads/` local → **S3 bucket `royale-media`**
- **Hosting frontends**: Vercel → **S3 + CloudFront** (sigue siendo igual de simple)
- **Base de datos**: MongoDB local `127.0.0.1` → **MongoDB Atlas M0** (gratis para siempre)

### No cambiamos
- React + Vite en el cliente y admin (sin tocar)
- MongoDB como base de datos (mismas queries, mismo esquema)
- Estructura de la API (mismos endpoints, misma lógica)
- Cookies JWT para autenticación (funciona igual con Lambda)

---

## Lo que ya está hecho

`server-py/` contiene la API completamente reescrita en Python:

```
server-py/
├── main.py            ← FastAPI app + handler de Lambda
├── database.py        ← Conexión PyMongo a MongoDB Atlas
├── auth.py            ← JWT (PyJWT)
├── storage.py         ← Upload de archivos a S3 (boto3)
├── helpers.py         ← Serialización MongoDB + paginación
├── routers/
│   ├── auth.py        ← POST /api/login, /api/logout, GET /api/verify
│   ├── public.py      ← GET /parfums, /parfum, /parfums/body, /cupon, /promotions
│   │                     POST/PUT/GET /transaction
│   ├── parfums.py     ← CRUD /api/parfum(s) (admin, protegido)
│   ├── types.py       ← CRUD /api/type(s) + upload iconos a S3
│   ├── bodies.py      ← CRUD /api/bod(y/ies) + upload imágenes a S3
│   ├── brands.py      ← CRUD /api/brand(s)
│   ├── versions.py    ← CRUD /api/version(s)
│   ├── promotions.py  ← CRUD /api/promotion(s) + upload media a S3
│   ├── coupons.py     ← CRUD /api/coupon(s)
│   ├── transactions.py← CRUD + export XLSX en memoria (sin disco)
│   └── users.py       ← CRUD + bcrypt para contraseñas
├── requirements.txt   ← fastapi, mangum, pymongo, PyJWT, boto3, openpyxl, bcrypt
├── template.yaml      ← AWS SAM: Lambda + API Gateway + EventBridge keep-warm
├── .env.example       ← Variables de entorno necesarias
└── DEPLOY.md          ← Guía detallada de deploy paso a paso
```

---

## Pasos de migración (en orden)

### Fase 1 — Base de datos
1. Crear cuenta en [atlas.mongodb.com](https://atlas.mongodb.com)
2. Crear cluster **M0 gratuito** (región us-east-1)
3. Crear usuario DB con contraseña fuerte
4. Whitelist IP: `0.0.0.0/0` (Lambda no tiene IP fija)
5. Importar los 10 JSON de `bd/backup/json/` con `mongoimport`

### Fase 2 — Imágenes a S3
1. Crear bucket `royale-media` en S3 (consola AWS o CLI)
2. Configurar acceso público de lectura (para que las URLs sean accesibles)
3. Subir los 128 archivos de `server/uploads/` manteniendo estructura de carpetas
4. Actualizar los documentos en Atlas: reemplazar `/uploads/...` por URLs `https://royale-media.s3.us-east-1.amazonaws.com/...`
   - Colecciones afectadas: `bodies` (campos `parfum_img`, `back_img`), `types` (campo `img`), `promotions` (campo `media`)

### Fase 3 — API en Lambda
1. Instalar [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)
2. Instalar [AWS CLI](https://aws.amazon.com/cli/) y configurar (`aws configure`)
3. Desde `server-py/`:
   ```bash
   sam build
   sam deploy --guided
   ```
4. SAM crea automáticamente: Lambda + API Gateway + IAM roles + EventBridge keep-warm
5. Configurar dominio personalizado `api.royalepanama.com` en API Gateway + certificado ACM
6. Apuntar CNAME `api.royalepanama.com` al dominio generado por API Gateway

### Fase 4 — Frontends en S3 + CloudFront
1. Crear archivos `.env` en `client/` y `admin/` con `VITE_SERVER_URL=https://api.royalepanama.com`
2. `npm run build` en ambos → genera `dist/`
3. Crear dos buckets S3: `royale-client-dist` y `royale-admin-dist`
4. Subir cada `dist/` a su bucket
5. Crear distribución CloudFront para cada bucket:
   - Configurar custom error 403/404 → `/index.html` con status 200 (necesario para React Router)
   - Asignar certificado ACM (debe ser región **us-east-1** para CloudFront)
6. Apuntar CNAMEs del dominio a los dominios CloudFront

---

## Herramientas necesarias (instalar una vez)

| Herramienta | Link |
|---|---|
| AWS CLI | https://aws.amazon.com/cli/ |
| AWS SAM CLI | https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html |
| MongoDB Database Tools (mongoimport) | https://www.mongodb.com/try/download/database-tools |
| Python 3.12 | https://www.python.org/downloads/ |

---

## Variables de entorno requeridas (Lambda)

```
MONGODB_URI=mongodb+srv://royale_user:<pw>@cluster0.xxxxx.mongodb.net/royale
JWT_SECRET=<secreto generado con: python -c "import secrets; print(secrets.token_hex(32))">
S3_MEDIA_BUCKET=royale-media
FRONTEND_URL=https://royalepanama.com
ADMIN_URL=https://admin.royalepanama.com
```

SAM las solicita en el `sam deploy --guided` y las almacena seguras en AWS.

---

## Referencia: guía completa de comandos

Ver [server-py/DEPLOY.md](../server-py/DEPLOY.md) para todos los comandos con ejemplos.
