# SIH Satellite Super-Resolution Project Documentation

This document provides a comprehensive technical overview of the current codebase architecture, stack, and implementation details for internal team reference.

---

## 1. TECH STACK

**Frontend:**
- **Framework:** React 19 (`^19.2.8`), Vite (`^8.2.2`)
- **Styling:** TailwindCSS 4 (`^4.3.3`)
- **UI & Visualization:** 
  - `lucide-react` (`^1.34.0`) for iconography
  - `react-globe.gl` (`^2.38.0`) and `three.js` (`^0.185.1`) for 3D globe visualization

**Backend (API):**
- **Framework:** FastAPI, Uvicorn (ASGI server)
- **Utilities:** `python-multipart` (for file uploads)

**ML & Training (SwinIR):**
- **Core ML:** PyTorch (`torch`), `torchvision`, `timm`, `einops`
- **Image Processing:** `Pillow` (PIL), `opencv-python` (cv2), `numpy`
- **Geospatial & Utils:** `rasterio`, `matplotlib`, `tqdm`

---

## 2. FRONTEND

### React Components
- **`App.jsx`**: The main application controller. Orchestrates state, handles image upload logic via `fetch`, manages the multi-view comparison viewport, and coordinates layout.
- **`GlobeHero.jsx`**: Renders the interactive 3D WebGL hero globe and "Launch Analysis" buttons.
- **`SystemTelemetry.jsx`**: A wrapper component providing the styled, technical bounding-box UI around the main image comparison viewport.
- **`ErrorHeatmap.jsx`**: An HTML5 Canvas-based component that computes live pixel-by-pixel Mean Absolute Error (MAE) and renders the visual error heatmap gradient.

### Folder Structure
```text
frontend/
├── package.json
├── index.html
├── vite.config.js
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css
    ├── App.css
    └── components/
        ├── ErrorHeatmap.jsx
        ├── GlobeHero.jsx
        └── SystemTelemetry.jsx
```

### State Management & External Calls
- **State Management:** Fully reliant on native React hooks (`useState`, `useEffect`, `useRef`). No external state libraries (like Redux or Zustand) are used.
- **API Calls:**
  - `GET /results.csv`: Fetches pre-computed metrics for the static demo scenarios from the local `public` folder.
  - `POST http://127.0.0.1:8000/enhance`: Transmits user-uploaded images via `FormData` to the FastAPI backend for real-time inference.

---

## 3. BACKEND

### Folder Structure
```text
backend/
├── main.py
├── requirements.txt
├── uploads/          # Auto-generated: stores raw user uploads
└── outputs/          # Auto-generated: stores SwinIR processed outputs
```

### API Endpoints
1. **`GET /`** (Health Check)
   - **Purpose:** Verifies server status and model loading.
   - **Response:** JSON containing `{"status": "Active", "model": "...", "device": "..."}`.

2. **`POST /enhance`** (Inference)
   - **Purpose:** Receives a low-resolution image, validates it, and runs SwinIR 4x super-resolution.
   - **Request:** `multipart/form-data` containing `file`.
   - **Response:** JSON containing Base64 encoded image and baseline metrics: 
     `{"image": "<base64_string>", "psnr_ai": <float>, "ssim_ai": <float>}`.

### Model Loading & Validation Safety
- **Loading:** The PyTorch model is loaded globally into VRAM/RAM exactly once during startup using FastAPI's `@asynccontextmanager lifespan`.
- **Pre-Inference Validation:** 
  - Max dimension > 2048px: Instantly rejected (`400 Bad Request`, "Image too large").
  - Max dimension > 512px: Instantly rejected (`400 Bad Request`, "Already high-resolution").
- **Timeout Safety:** The synchronous `super_resolve` PyTorch function is wrapped in `asyncio.to_thread` and gated by `asyncio.wait_for` with a hard **45.0-second timeout** to prevent hanging the API event loop.

---

## 4. ML / MODEL

### Folder Structure
```text
SIH ML PART/
└── SwinIR/
    ├── requirements.txt
    ├── README.md
    ├── deployment_model/
    │   ├── swinir_sentinel2_x4.pth
    │   └── model_config.json
    ├── models/
    │   └── network_swinir.py
    └── utils/
        └── util_calculate_psnr_ssim.py
```

### Architecture
- **Model:** SwinIR (Swin Transformer for Image Restoration).
- **Scale Factor:** 4× (e.g., 64x64 input → 256x256 output).
- **Configuration:** Window Size = 8, Embedding Dimension = 180, Swin Transformer Layers = 6, Upsampler = PixelShuffle.

### Training Details
- **Codebase Status:** The actual training scripts (loss functions, optimizers, steps) are **not present in the current repository**. 
- The repository only contains the deployment pipeline and a pre-trained `.pth` checkpoint that was historically fine-tuned using paired Sentinel-2 (low-res) and NAIP (high-res) imagery.

### Error Map Computation (Live Visualization)
The "Reconstruction Error vs Ground Truth" heatmap is computed **in the frontend (`ErrorHeatmap.jsx`)**, not the ML backend. 
- **Logic:** It loads the AI output and the Reference image into invisible HTML5 Canvases and extracts raw `ImageData`. For every pixel, it computes the Mean Absolute Error across the RGB channels: `(abs(R1-R2) + abs(G1-G2) + abs(B1-B2)) / 3`.
- **Visualization:** The error is normalized (0 to 1), run through a non-linear Gamma curve (`0.5`) to boost visibility of minor artifacts, and mapped to a gradient (Yellow for 0 error → Red for High error).

### Validation Metrics (Backend)
Metrics are calculated in the backend via `util_calculate_psnr_ssim.py` by comparing the SwinIR output against a standard **Bicubic upscale** baseline.
- **PSNR:** Computes Mean Squared Error (MSE) using `float64` precision, trims crop borders, and applies `20 * log10(255 / sqrt(MSE))`.
- **SSIM:** Applies an 11x11 Gaussian Kernel (sigma 1.5) over the images. Calculates local means (mu), variances (sigma_sq), and covariances (sigma12) to generate an SSIM map, returning the average.

---

## 5. DATA

- **Training Data:** Paired Sentinel-2 and NAIP reference imagery (referenced in documentation, but not included or accessed in the repo).
- **Static Demo Scenarios:** The UI relies on pre-processed sample images (`sample_1`, `sample_2`, `sample_3`) stored directly in `frontend/public/` (input, output, and ground-truth reference pairs).
- **Demo Metrics:** Static pre-calculated metrics for the demo scenarios are stored in and parsed from `frontend/public/results.csv`.

---

## 6. KNOWN LIMITATIONS

1. **Missing Ground Truth for Custom Uploads:** When users upload live imagery, no High-Resolution reference physically exists. 
   - *Workaround:* The backend uses a Bicubic upscale as a baseline to compute PSNR/SSIM, and the frontend dynamically scales up the low-resolution input to compute the Error Heatmap. These are relative approximations rather than absolute ground-truth validations.
2. **No Satellite-Content Classifier:** The backend lacks a classifier to verify if an uploaded image is actually satellite topography. It relies entirely on pixel dimension validation, meaning users can upload normal photographs if they fall within the 512x512px limits.
3. **Hardware-bound Bottlenecks:** Inference is synchronous PyTorch processing; heavy concurrent traffic could exhaust thread pools despite the 45-second timeout limits.
