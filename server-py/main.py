import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from dotenv import load_dotenv

load_dotenv()

from routers import auth, parfums, brands, types, bodies, versions
from routers import promotions, coupons, transactions, users, public
from routers import analytics, delivery, yappy, wompi, discounts, images, cortes, providers, consolidacion, subscribers

app = FastAPI(title="Royale API")

origins = [
    os.environ.get("FRONTEND_URL", "https://royalepanama.com"),
    os.environ.get("ADMIN_URL", "https://admin.royalepanama.com"),
    "https://www.royalepanama.com",
    "https://www.admin.royalepanama.com",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:4173",
    "http://localhost:4174",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(parfums.router)
app.include_router(brands.router)
app.include_router(types.router)
app.include_router(bodies.router)
app.include_router(versions.router)
app.include_router(promotions.router)
app.include_router(coupons.router)
app.include_router(transactions.router)
app.include_router(users.router)
app.include_router(public.router)
app.include_router(analytics.router)
app.include_router(delivery.router)
app.include_router(yappy.router)
app.include_router(wompi.router)
app.include_router(discounts.router)
app.include_router(images.router)
app.include_router(cortes.router)
app.include_router(providers.router)
app.include_router(consolidacion.router)
app.include_router(subscribers.router)

# Lambda handler
handler = Mangum(app, lifespan="off")
