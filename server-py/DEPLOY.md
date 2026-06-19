# Deploy Guide — Royale API en AWS

## Prerequisitos

- Cuenta AWS creada (https://aws.amazon.com)
- AWS CLI instalado y configurado (`aws configure`)
- AWS SAM CLI instalado (https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)
- Python 3.12 instalado localmente
- MongoDB Atlas cuenta gratuita (https://www.mongodb.com/atlas)

---

## Fase 1 — Base de datos (MongoDB Atlas M0)

```bash
# 1. Crear cuenta en atlas.mongodb.com
# 2. Crear cluster M0 (gratuito) → región us-east-1
# 3. Crear usuario DB: royale_user / <contraseña fuerte>
# 4. Whitelist de IPs: 0.0.0.0/0 (Lambda no tiene IP fija)
# 5. Copiar el connection string: mongodb+srv://royale_user:<pw>@cluster0.xxxxx.mongodb.net/royale

# Importar los backups
cd C:\Users\Pedro\Proyectos\Royale\bd\backup\json

# Instalar mongoimport si no lo tienes (viene con MongoDB Database Tools)
# https://www.mongodb.com/try/download/database-tools

mongoimport --uri "mongodb+srv://royale_user:<pw>@cluster0.xxxxx.mongodb.net/royale" \
  --collection parfums --file parfum.json --jsonArray

mongoimport --uri "..." --collection brands --file brand.json --jsonArray
mongoimport --uri "..." --collection types --file types.json --jsonArray
mongoimport --uri "..." --collection bodies --file body.json --jsonArray
mongoimport --uri "..." --collection versions --file version.json --jsonArray
mongoimport --uri "..." --collection promotions --file promotion.json --jsonArray
mongoimport --uri "..." --collection coupons --file coupon.json --jsonArray
mongoimport --uri "..." --collection transactions --file transaction.json --jsonArray
mongoimport --uri "..." --collection users --file user.json --jsonArray
```

---

## Fase 2 — Imágenes a S3

```bash
# Crear bucket S3 (en consola AWS o CLI)
aws s3 mb s3://royale-media --region us-east-1

# Configurar acceso público de lectura (necesario para que las imágenes sean accesibles)
aws s3api put-bucket-policy --bucket royale-media --policy '{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::royale-media/*"
  }]
}'

# Subir todas las imágenes manteniendo la estructura de carpetas
aws s3 sync "C:\Users\Pedro\Proyectos\Royale\server\uploads" s3://royale-media --region us-east-1

# Las URLs resultantes tendrán el formato:
# https://royale-media.s3.us-east-1.amazonaws.com/body/1737321096594-MessiFraganceEauDeParfumBack.png
# https://royale-media.s3.us-east-1.amazonaws.com/parfumIcon/1737474035257-GivenchyIrresistible80-50.webp
# https://royale-media.s3.us-east-1.amazonaws.com/promotion/1739124092309-video.mp4

# IMPORTANTE: Actualizar los documentos en MongoDB Atlas para reemplazar
# los paths /uploads/... por las URLs completas de S3.
# Ejecutar este script en MongoDB Atlas → Collections → botón "..." → Aggregation:
# O usar mongosh:
# db.bodies.updateMany(
#   { parfum_img: { $regex: "^/uploads/" } },
#   [{ $set: { parfum_img: { $replaceOne: { input: "$parfum_img", find: "/uploads/", replacement: "https://royale-media.s3.us-east-1.amazonaws.com/" } } } }]
# )
# db.bodies.updateMany(
#   { back_img: { $regex: "^/uploads/" } },
#   [{ $set: { back_img: { $replaceOne: { input: "$back_img", find: "/uploads/", replacement: "https://royale-media.s3.us-east-1.amazonaws.com/" } } } }]
# )
# db.types.updateMany(
#   { img: { $regex: "^/uploads/" } },
#   [{ $set: { img: { $replaceOne: { input: "$img", find: "/uploads/", replacement: "https://royale-media.s3.us-east-1.amazonaws.com/" } } } }]
# )
# db.promotions.updateMany(
#   { media: { $regex: "^/uploads/" } },
#   [{ $set: { media: { $replaceOne: { input: "$media", find: "/uploads/", replacement: "https://royale-media.s3.us-east-1.amazonaws.com/" } } } }]
# )
```

---

## Fase 3 — Deploy de la API en Lambda

```bash
cd C:\Users\Pedro\Proyectos\Royale\server-py

# Instalar dependencias (SAM las empaqueta automáticamente)
pip install -r requirements.txt

# Build (SAM crea un paquete de despliegue con las dependencias)
sam build

# Primer deploy (guía interactiva — solo la primera vez)
sam deploy --guided
# Responder:
#   Stack Name: royale-api
#   AWS Region: us-east-1
#   MongodbUri: <tu connection string de Atlas>
#   JwtSecret: <secreto fuerte generado con: python -c "import secrets; print(secrets.token_hex(32))">
#   MediaBucket: royale-media
#   FrontendUrl: https://royalepanama.com
#   AdminUrl: https://admin.royalepanama.com
#   Save arguments to samconfig.toml: Y

# Deploys siguientes (usa samconfig.toml guardado)
sam build && sam deploy

# Al finalizar, SAM muestra la URL del API Gateway:
# Outputs: ApiUrl = https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com

# Configurar dominio personalizado api.royalepanama.com:
# 1. Ir a API Gateway → Custom domain names → Create
# 2. Domain: api.royalepanama.com
# 3. Certificate: crear en ACM (us-east-1) para api.royalepanama.com
# 4. Copiar el "API Gateway domain name" (algo como d-xxxxx.execute-api.us-east-1.amazonaws.com)
# 5. En tu registrador de dominio, agregar CNAME: api.royalepanama.com → ese valor
```

---

## Fase 4 — Frontends en S3 + CloudFront

```bash
# --- Cliente ---
# Crear bucket
aws s3 mb s3://royale-client-dist --region us-east-1

# Configurar como sitio web estático
aws s3 website s3://royale-client-dist --index-document index.html --error-document index.html

# Build y subir
cd C:\Users\Pedro\Proyectos\Royale\client

# Crear .env con la URL correcta
echo "VITE_SERVER_URL=https://api.royalepanama.com" > .env
echo "VITE_FRONTEND_URL=https://royalepanama.com" >> .env

npm run build
aws s3 sync dist/ s3://royale-client-dist

# --- Admin ---
cd C:\Users\Pedro\Proyectos\Royale\admin
echo "VITE_SERVER_URL=https://api.royalepanama.com" > .env
echo "VITE_FRONTEND_URL=https://royalepanama.com" >> .env

npm run build
aws s3 mb s3://royale-admin-dist --region us-east-1
aws s3 website s3://royale-admin-dist --index-document index.html --error-document index.html
aws s3 sync dist/ s3://royale-admin-dist

# --- CloudFront (hacer para cada frontend en la consola AWS) ---
# 1. CloudFront → Create distribution
# 2. Origin: el bucket S3 (usar la URL de website endpoint, no la URL directa del bucket)
# 3. Default root object: index.html
# 4. Custom error responses:
#    - 403 → /index.html (status 200)
#    - 404 → /index.html (status 200)
# 5. Viewer protocol policy: Redirect HTTP to HTTPS
# 6. Alternate domain name (CNAME): royalepanama.com (o admin.royalepanama.com)
# 7. SSL certificate: solicitar en ACM (DEBE ser us-east-1 para CloudFront)
# 8. Agregar en tu registrador: CNAME royalepanama.com → xxxxxx.cloudfront.net
```

---

## Verificación post-deploy

```bash
# 1. API responde
curl https://api.royalepanama.com/api/verify
# → {"detail":"No token, authorization denied"} (401 — correcto)

# 2. Imagen accesible
curl -I https://royale-media.s3.us-east-1.amazonaws.com/parfumIcon/1737474035257-GivenchyIrresistible80-50.webp
# → HTTP/1.1 200 OK

# 3. Frontend cliente carga
# Abrir https://royalepanama.com en el navegador

# 4. Admin — login y CRUD
# Abrir https://admin.royalepanama.com → ingresar credenciales → verificar que lista perfumes

# 5. Carrito → checkout → verificar transacción en admin

# 6. Export XLSX desde admin → descarga el archivo
```

---

## Actualizaciones futuras de la API

```bash
cd C:\Users\Pedro\Proyectos\Royale\server-py
sam build && sam deploy
# (usa los parámetros guardados en samconfig.toml)
```

## Actualizaciones futuras de los frontends

```bash
# Cliente
cd C:\Users\Pedro\Proyectos\Royale\client && npm run build
aws s3 sync dist/ s3://royale-client-dist --delete
aws cloudfront create-invalidation --distribution-id <ID> --paths "/*"

# Admin
cd C:\Users\Pedro\Proyectos\Royale\admin && npm run build
aws s3 sync dist/ s3://royale-admin-dist --delete
aws cloudfront create-invalidation --distribution-id <ID> --paths "/*"
```
