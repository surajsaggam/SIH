"""
Backend Configuration Module
Responsibility: Application settings, environment variables, model paths,
and runtime configuration (CORS, storage paths, inference parameters).
"""

from pydantic import BaseModel
import os


class Settings(BaseModel):
    app_name: str = "Satellite Super-Resolution API"
    api_prefix: str = "/api/v1"
    weights_path: str = os.getenv("MODEL_WEIGHTS_PATH", "../../ml/weights")
    allowed_origins: list[str] = ["*"]
    max_upload_size_mb: int = 50


settings = Settings()
