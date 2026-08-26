"""
Upload Routes
Responsibility: Endpoints for uploading and validating low-resolution satellite imagery
(GeoTIFF, PNG, JPEG) and storing them for processing.
"""

from fastapi import APIRouter, UploadFile, File

router = APIRouter()


@router.post("/upload")
async def upload_satellite_image(file: UploadFile = File(...)):
    """
    Placeholder endpoint to receive and validate uploaded satellite imagery.
    """
    return {
        "filename": file.filename,
        "content_type": file.content_type,
        "status": "pending_implementation",
    }
