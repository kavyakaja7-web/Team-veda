"""
main.py — FastAPI application entry point for the GVMC GVP Tracking System.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import gvp as gvp_router
from app.routes import complaint as complaint_router

app = FastAPI(
    title="GVMC GVP Tracking System",
    description=(
        "Backend API for the Greater Visakhapatnam Municipal Corporation (GVMC) "
        "Garbage Vulnerable Point (GVP) tracking pilot. "
        "Cleanup endpoints will be added in a future iteration."
    ),
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ---------------------------------------------------------------------------
# CORS — permissive for dev / hackathon; restrict origins in production
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(gvp_router.router)
app.include_router(complaint_router.router)


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/health", tags=["Health"], summary="Health check")
def health_check():
    """Returns a simple status-ok payload to confirm the API is reachable."""
    return {"status": "ok"}
