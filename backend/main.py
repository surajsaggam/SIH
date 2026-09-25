import os
import sys
import io
import uuid
import numpy as np
import torch
import asyncio
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

from pydantic import BaseModel
from typing import Optional, Dict, Any

from model_loader import load_swinir_model
from inference import super_resolve
from analysis import analyze, get_classifier
from chat import chat as run_chat

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

    print("Pre-loading Land Cover Classifier (EuroSAT ConvNeXt)...")
    try:
        get_classifier()
        print("EuroSAT classifier pre-loaded successfully.")
    except Exception as e:
        print(f"[WARNING] EuroSAT classifier pre-load failed (will retry on first /analyze request): {e}")

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

        # Validate image dimensions early to prevent hanging inference
        max_dim = max(pil_image.width, pil_image.height)
        print(f"[UPLOAD] Dimensions: {pil_image.width}x{pil_image.height} (Max: {max_dim}px)")
        
        if max_dim > 2048:
            print(f"[REJECTED] Image too large: {max_dim}px")
            raise HTTPException(
                status_code=400, 
                detail="Image too large for real-time demo processing. Please upload a smaller tile (under 2048x2048px)."
            )
        if max_dim > 512:
            print(f"[REJECTED] Already high-resolution: {max_dim}px")
            raise HTTPException(
                status_code=400, 
                detail="This image already appears to be high-resolution — super-resolution enhancement is intended for lower-resolution inputs (e.g. 10m Sentinel-2 imagery). Try uploading a lower-resolution satellite image instead."
            )

        if swinir_model is None:
            # Fallback load if not initialized
            print("[INFO] Fallback model loading started...")
            checkpoint_path = os.path.join(SWINIR_DIR, "deployment_model", "swinir_sentinel2_x4.pth")
            swinir_model, model_device = load_swinir_model(model_path=checkpoint_path)

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

        # Run SwinIR 4x Super-Resolution with hard timeout
        print("[MODEL] Running SwinIR x4...")
        try:
            sr_tensor = await asyncio.wait_for(
                asyncio.to_thread(
                    super_resolve,
                    image_tensor=input_tensor,
                    model=swinir_model,
                    device=model_device,
                    tile=128,
                    tile_overlap=16
                ),
                timeout=45.0
            )
        except asyncio.TimeoutError:
            print("[ERROR] Inference timeout exceeded")
            raise HTTPException(
                status_code=408, 
                detail="Processing took too long — please try a smaller image or try again."
            )
        print("[MODEL] Inference completed")

        # Convert output tensor [3, 4H, 4W] back to PIL Image
        sr_np = (sr_tensor.permute(1, 2, 0).numpy() * 255.0).round().astype(np.uint8)
        output_image = Image.fromarray(sr_np)

        # Calculate metrics against a Bicubic baseline
        bicubic_image = pil_image.resize((output_image.width, output_image.height), Image.Resampling.BICUBIC)
        bicubic_np = np.array(bicubic_image)
        
        try:
            from utils.util_calculate_psnr_ssim import calculate_psnr, calculate_ssim
            psnr_val = calculate_psnr(sr_np, bicubic_np, crop_border=4, input_order='HWC')
            ssim_val = calculate_ssim(sr_np, bicubic_np, crop_border=4, input_order='HWC')
        except Exception as metric_err:
            print(f"[WARNING] Failed to calculate metrics: {metric_err}")
            psnr_val = None
            ssim_val = None

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

        import base64
        base64_encoded = base64.b64encode(png_bytes).decode('utf-8')

        print(f"[RESPONSE] Returning enhanced PNG + metrics")
        return {
            "image": base64_encoded,
            "psnr_ai": psnr_val,
            "ssim_ai": ssim_val
        }
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
        "device": str(model_device) if model_device else "Pending initialization",
        "land_cover_agent": "EuroSAT ConvNeXt-Tiny Active"
    }

@app.post("/analyze")
async def analyze_route(file: UploadFile = File(...)):
    print(f"[ANALYZE] Received image file: {file.filename}")
    try:
        contents = await file.read()
        try:
            pil_image = Image.open(io.BytesIO(contents)).convert("RGB")
        except Exception as img_err:
            print(f"[ERROR] Upload is not a valid image: {img_err}")
            raise HTTPException(status_code=400, detail="Invalid image file format for analysis.")

        result = analyze(pil_image)
        print(f"[ANALYZE] Result: {result.get('label')} ({result.get('confidence')}%)")
        return result
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Land cover analysis failed: {str(e)}")

class ChatRequest(BaseModel):
    session_id: Optional[str] = "default"
    question: str
    analysis: Optional[Dict[str, Any]] = None

@app.post("/chat")
async def chat_route(payload: ChatRequest):
    print(f"[CHAT] Received question: '{payload.question[:60]}' for session: {payload.session_id}")
    try:
        answer = run_chat(payload.session_id, payload.question, payload.analysis)
        return {"answer": answer}
    except Exception as e:
        print(f"[ERROR] Chat failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Chat inference failed: {str(e)}")


