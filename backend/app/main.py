"""
PhishGuard — FastAPI Application Entry Point
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import CORS_ORIGINS
from .database import init_db
from .services.ml_predictor import predictor
from .routers import scanner, history, models, cases, audit_logs, research


# ─── Create App ──────────────────────────────────────────────────

app = FastAPI(
    title="PhishGuard API",
    description="AI-Based Phishing Website Detection & Explainable Cyber Threat Analysis",
    version="1.0.0",
)

# ─── CORS Middleware ─────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Include Routers ─────────────────────────────────────────────

app.include_router(scanner.router)
app.include_router(history.router)
app.include_router(models.router)
app.include_router(cases.router)
app.include_router(audit_logs.router)
app.include_router(research.router)


# ─── Startup Event ───────────────────────────────────────────────

@app.on_event("startup")
def startup_event():
    """Initialize database and load ML models on server start."""
    print("\n" + "="*60)
    print("  PhishGuard API Starting...")
    print("="*60)
    
    # Initialize database tables
    print("\n[1/2] Initializing database...")
    init_db()
    print("  Database ready.")
    
    # Load ML models
    print("\n[2/2] Loading ML models...")
    loaded = predictor.load_models()
    if loaded:
        print("  ML models loaded successfully.")
    else:
        print("  WARNING: ML models not found!")
        print("  Run: cd phishguard/ml && python generate_dataset.py && python train.py")
    
    print("\n" + "="*60)
    print("  PhishGuard API Ready!")
    print("  Docs: http://localhost:8000/docs")
    print("="*60 + "\n")


# ─── Root Endpoint ───────────────────────────────────────────────

@app.get("/")
def root():
    return {
        "name": "PhishGuard API",
        "version": "1.0.0",
        "status": "running",
        "models_loaded": predictor.is_loaded,
        "docs": "/docs",
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "models_loaded": predictor.is_loaded,
    }


@app.get("/api/status")
def api_status():
    """Return ML predictor status: which models are loaded, best model, etc."""
    return predictor.get_status()
