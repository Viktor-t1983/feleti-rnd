from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import financial

app = FastAPI(
    title="FELETI R&D Financial Calculator",
    description="API для финансовых расчётов R&D проектов",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS для frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev
        "http://localhost:3001",  # API
        "http://localhost:3000",  # Альтернативный порт
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Регистрируем роутер
app.include_router(financial.router)

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "calc-engine",
        "version": "1.0.0"
    }

@app.get("/")
async def root():
    """Root endpoint с информацией"""
    return {
        "message": "FELETI Financial Calculator API",
        "docs": "/docs",
        "health": "/health",
        "endpoints": {
            "npv": "POST /api/financial/npv",
            "irr": "POST /api/financial/irr",
            "roi": "POST /api/financial/roi",
            "payback": "POST /api/financial/payback"
        }
    }
