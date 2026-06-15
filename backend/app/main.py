from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings

from app.db.database import Base, engine
from app.models.product import Product
from app.routers.products import router as products_router
from app.models.customer import Customer
from app.routers.customers import router as customers_router
from app.models.order import Order, OrderItem
from app.routers.orders import router as orders_router
from app.routers.dashboard import router as dashboard_router

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://inventory-flow-blue.vercel.app",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products_router)
app.include_router(customers_router)
app.include_router(orders_router)
app.include_router(dashboard_router)

@app.get("/health")
def health_check():
    return {
        "status":"ok",
        "app":settings.APP_NAME,
        "version":settings.APP_VERSION,
    }