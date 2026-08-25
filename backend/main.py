from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import io
from PIL import Image

app = FastAPI(title="SIH PS 26142 - Super Resolution API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/enhance")
async def enhance_image(file: UploadFile = File(...)):
    # Read the uploaded image
    contents = await file.read()
    image = Image.open(io.BytesIO(contents))
    
    # Mocking super resolution by just resizing 4x
    # "model inference pending GPU integration"
    new_size = (image.width * 4, image.height * 4)
    resized_image = image.resize(new_size, Image.Resampling.LANCZOS)
    
    # Save to a byte stream
    img_byte_arr = io.BytesIO()
    resized_image.save(img_byte_arr, format=image.format or "PNG")
    img_byte_arr.seek(0)
    
    return StreamingResponse(img_byte_arr, media_type=f"image/{image.format.lower() if image.format else 'png'}")

@app.get("/")
def read_root():
    return {"message": "Super Resolution Backend Active. Model inference pending GPU integration."}
