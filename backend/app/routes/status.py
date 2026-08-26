"""
Status & Health Routes
Responsibility: Health check endpoints, GPU/CPU hardware availability status,
and asynchronous task progress polling.
"""

from fastapi import APIRouter

router = APIRouter()


@router.get("/status")
def get_service_status():
    """
    Placeholder endpoint returning system health and backend service status.
    """
    return {
        "status": "healthy",
        "model_loaded": False,
        "device": "pending_initialization",
    }
