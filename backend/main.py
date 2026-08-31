import os
import sys
import io
import uuid
import numpy as np
import torch
from PIL import Image
from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

# Locate and add SwinIR ML directory to python module path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
SWINIR_DIR = os.path.join(PROJECT_ROOT, "SIH ML PART", "SwinIR")
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")
OUTPUTS_DIR = os.path.join(BASE_DIR, "outputs")

# Ensure storage directories exist
os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(OUTPUTS_DIR, exist_ok=True)

if SWINIR_DIR not in sys.path:
    sys.path.insert(0, SWINIR_DIR)

from model_loader import load_swinir_model
from inference import super_resolve

# Global model references
swinir_model = None
model_device = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global swinir_model, model_device
    print("Loading SwinIR model checkpoint...")
    checkpoint_path = os.path.join(SWINIR_DIR, "deployment_model", "swinir_sentinel2_x4.pth")
    swinir_model, model_device = load_swinir_model(model_path=checkpoint_path)
    print(f"SwinIR model loaded successfully on device: {model_device}")
    yield

app = FastAPI(title="SIH PS 26142 - Super Resolution API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/enhance")
async def enhance_image(file: UploadFile = File(...)):
    global swinir_model, model_device
    if swinir_model is None:
        # Fallback load if not initialized
        checkpoint_path = os.path.join(SWINIR_DIR, "deployment_model", "swinir_sentinel2_x4.pth")
        swinir_model, model_device = load_swinir_model(model_path=checkpoint_path)

    print(f"[UPLOAD] Received: {file.filename}")

    try:
        # Read the uploaded image bytes
        contents = await file.read()
        
        # Verify valid image format
        try:
            pil_image = Image.open(io.BytesIO(contents)).convert("RGB")
        except Exception as img_err:
            print(f"[ERROR] Upload is not a valid image: {img_err}")
            raise HTTPException(status_code=400, detail="Invalid image file format.")

        # Generate unique filename for persistent storage
        file_id = str(uuid.uuid4())[:8]
        orig_ext = os.path.splitext(file.filename)[1].lower() if file.filename else ".png"
        if not orig_ext:
            orig_ext = ".png"
            
        input_filename = f"{file_id}_input{orig_ext}"
        input_save_path = os.path.join(UPLOADS_DIR, input_filename)

        # Save original uploaded file
        with open(input_save_path, "wb") as f:
            f.write(contents)
        print(f"[UPLOAD] Saved original: {input_save_path}")

        # Convert PIL Image to PyTorch FloatTensor [3, H, W] normalized to [0, 1]
        img_np = np.array(pil_image, dtype=np.float32) / 255.0
        input_tensor = torch.from_numpy(img_np).permute(2, 0, 1).float()

        # Run SwinIR 4x Super-Resolution
        print("[MODEL] Running SwinIR x4...")
        sr_tensor = super_resolve(
            image_tensor=input_tensor,
            model=swinir_model,
            device=model_device,
            tile=128,
            tile_overlap=16
        )
        print("[MODEL] Inference completed")

        # Convert output tensor [3, 4H, 4W] back to PIL Image
        sr_np = (sr_tensor.permute(1, 2, 0).numpy() * 255.0).round().astype(np.uint8)
        output_image = Image.fromarray(sr_np)

        # Save output image to byte stream
        img_byte_arr = io.BytesIO()
        output_image.save(img_byte_arr, format="PNG")
        png_bytes = img_byte_arr.getvalue()

        # Save enhanced PNG persistently
        output_filename = f"{file_id}_enhanced.png"
        output_save_path = os.path.join(OUTPUTS_DIR, output_filename)
        with open(output_save_path, "wb") as f:
            f.write(png_bytes)
        print(f"[OUTPUT] Saved enhanced image: {output_save_path}")

        print(f"[RESPONSE] Returning enhanced PNG: {len(png_bytes)} bytes")
        return Response(content=png_bytes, media_type="image/png")
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] SwinIR inference failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"SwinIR inference failed: {str(e)}")

@app.get("/")
def read_root():
    return {
        "status": "Active",
        "model": "SwinIR Sentinel-2 4x Super-Resolution",
        "device": str(model_device) if model_device else "Pending initialization"
    }

