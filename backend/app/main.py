"""
FastAPI Application Entrypoint
Responsibility: Initializes the FastAPI app, registers middleware, includes API routes,
and manages application startup/shutdown lifecycle events.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routes import upload, infer, status

app = FastAPI(
    title=settings.app_name,
    description="Backend API for Satellite Image Super-Resolution (SRM)",
    version="0.1.0",
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register route modules
app.include_router(upload.router, prefix=settings.api_prefix, tags=["Upload"])
app.include_router(infer.router, prefix=settings.api_prefix, tags=["Inference"])
app.include_router(status.router, prefix=settings.api_prefix, tags=["Status"])


@app.get("/")
def root():
    return {
        "service": settings.app_name,
        "status": "online",
        "version": "0.1.0",
    }
