# Sentinel-2 Super-Resolution Mapping (SRM) Dashboard & RAG Agent
## Technical Documentation & Branch Specification (`srm-dashboard-rag-agent`)

---

## 1. Project Overview

The **Sentinel-2 Super-Resolution Mapping (SRM) Dashboard** is a mission-control web platform designed for Earth Observation (EO) satellite imagery analysis. It bridges deep learning super-resolution with automated geospatial intelligence and retrieval-augmented reasoning.

### Core Capabilities:
1. **Deep Learning Super-Resolution (SwinIR):**
   - Ingests raw or standard 10m Ground Sample Distance (GSD) Sentinel-2 imagery (RGB/multispectral bands).
   - Processes tiles through a fine-tuned Swin Transformer (`SwinIR`) model (`swinir_sentinel2_x4.pth`) producing **4× super-resolved (2.5m effective GSD)** outputs.
   - Quantifies reconstruction fidelity with dynamic PSNR (Peak Signal-to-Noise Ratio) and SSIM (Structural Similarity Index Measure) benchmarks against standard bicubic interpolation.
2. **Interactive Telemetry & Error Heatmaps:**
   - Dual-viewport and split-slider comparisons (Bicubic / Low-Res vs. SwinIR AI Enhanced vs. High-Res Ground Truth).
   - Real-time client-side Mean Absolute Error (MAE) heatmap rendered dynamically on HTML5 Canvas.
3. **Automated Land Cover Classification (EuroSAT ConvNeXt):**
   - Evaluates the 4× super-resolved image with a pretrained EuroSAT classifier (`mrm8488/convnext-tiny-finetuned-eurosat`).
   - Produces a full probability distribution across the 10 standard Sentinel-2 EuroSAT classes.
   - Computes lightweight heuristic surface proxies for vegetation, water, and urban density.
4. **Grounded RAG Agent (Retrieval-Augmented Generation):**
   - Indexes verified domain guidelines for crop cultivation and disaster risk mitigation keyed to the detected land-cover class (`backend/kb.json`).
   - Grounded LLM reasoning powered by **Groq** (`llama-3.3-70b-versatile`) or **Cerebras** (`gpt-oss-120b`).
   - **Zero-Failure Fallback:** If no API key is provided or the cloud LLM is unreachable, the system executes a deterministic synthesis engine, ensuring 100% demo reliability without external dependencies.

---

## 2. RAG Agent: What Was Added & Changed

On this branch (`srm-dashboard-rag-agent`), the platform evolved from a pure image enhancement viewer into an end-to-end Earth Observation decision-support system:

* **Automated Inference Pipeline (`/analyze`):** Triggered automatically whenever a user selects a preset scene or enhances a custom upload.
* **10-Class EuroSAT Classification:** Replaces static placeholders with live inference using `convnext-tiny-finetuned-eurosat`.
* **Surface Coverage Heuristics:** Algorithmic spectral proxies calculating vegetation %, water %, and urban %.
* **Curated Domain Knowledge Base (`backend/kb.json`):** Verified agronomical and disaster mitigation guidelines across all 10 EuroSAT classes.
* **Grounded AI Chat Endpoint (`/chat`):** REST endpoint maintaining rolling conversation memory (up to 8 turns) and injecting live classification + heuristics + KB context into every LLM query.
* **Multi-Provider LLM Integration:** Native REST support for **Groq** (via `llama-3.3-70b-versatile`) and **Cerebras** (via `gpt-oss-120b`).
* **Deterministic Fallback Engine:** Guarantees intelligent, context-aware answers even completely offline without an API key.
* **New UI Components:**
  - `LandCoverAnalysis.jsx`: Step 06 overview showing predicted class, confidence, top-3 bar chart, and heuristic meters.
  - `DeepAnalysisPage.jsx`: Full-screen deep dive with 10-class distribution, tabbed agronomy/disaster insights, and provenance documentation.
  - `ClassBarChart.jsx`: Recharts-powered vertical bar chart with custom styling and tooltips.
  - `ChatBot.jsx`: Mission-control chat interface with prompt pills, session management, and Markdown rendering.

---

## 3. System Architecture & Data Flow

### Architectural Diagram

```
+-----------------------------------------------------------------------------------+
|                                 FRONTEND (React 19 + Vite)                        |
|                                                                                   |
|  [GlobeHero] ---> [Preset Selector / File Upload] ---> [Before/After Slider]      |
|                               |                                |                  |
|                        (Upload LR Image)               (Canvas Error Heatmap)     |
|                               |                                                   |
|                               v                                                   |
|                   POST http://127.0.0.1:8000/enhance                              |
|                   POST http://127.0.0.1:8000/analyze                              |
|                               |                                                   |
|                               v                                                   |
|     [LandCoverAnalysis] ---> [VIEW FULL ANALYSIS] ---> [DeepAnalysisPage]         |
|      (Top-3 Probabilities,                              (Full 10-Class Chart,     |
|       Surface Heuristics)                                Tabbed KB Insights,      |
|                                                          Docked ChatBot.jsx)      |
|                                                                 |                 |
|                                                          POST /chat               |
+-----------------------------------------------------------------|-----------------+
                                                                  |
                                                                  v
+-----------------------------------------------------------------------------------+
|                                FASTAPI BACKEND (Python 3.10+)                     |
|                                                                                   |
|  1. /enhance (main.py):                                                           |
|     * SwinIR 4x Model (swinir_sentinel2_x4.pth) [PyTorch, 45s hard timeout]       |
|     * PSNR / SSIM Calculation against Bicubic baseline                            |
|                                                                                   |
|  2. /analyze (analysis.py):                                                       |
|     * EuroSAT ConvNeXt-Tiny Pipeline (mrm8488/convnext-tiny-finetuned-eurosat)    |
|     * Heuristic spectral proxies (Vegetation, Water, Urban %)                     |
|     * KB lookup from backend/kb.json                                              |
|                                                                                   |
|  3. /chat (chat.py):                                                              |
|     * Session Memory (deque maxlen=8)                                             |
|     * Grounded System Prompt Construction                                         |
|     * Provider Routing (Groq vs Cerebras)                                         |
|     * Fallback Engine (_build_fallback_response) if no API key or on error        |
+-----------------------------------------------------------------------------------+
                               |                                  |
                               v                                  v
              +--------------------------------+   +-------------------------------+
              |   Groq Cloud API (Optional)    |   | Deterministic Offline Engine  |
              |   llama-3.3-70b-versatile      |   | (Static KB + Live Metrics)    |
              +--------------------------------+   +-------------------------------+
```

### End-to-End RAG Data Flow

1. **Image Selection/Upload:** User selects a preset Sentinel-2 tile or uploads an image.
2. **Super-Resolution (`POST /enhance`):** SwinIR scales the image by 4×.
3. **Analysis Dispatch (`POST /analyze`):** The enhanced image is sent to `/analyze`.
4. **Classification & Heuristics:**
   - EuroSAT ConvNeXt classifies the tile into one of 10 categories (e.g., `AnnualCrop`, 98.4%).
   - `heuristics()` computes green channel prominence, blue water thresholds, and urban spectral variance.
5. **KB Enrichment:** Domain rules for `AnnualCrop` are retrieved from `backend/kb.json`.
6. **Frontend Display:** Frontend renders the classification badge, top-3 classes, and heuristic cards.
7. **Interactive Query (`POST /chat`):**
   - User submits: *"What crops should I cultivate here?"*
   - Payload includes `session_id`, `question`, and `analysis` object.
   - `backend/chat.py` constructs a system prompt injecting:
     - Predicted primary class & confidence.
     - Complete 10-class probability distribution.
     - Surface heuristics (vegetation, water, urban percentages).
     - Retrieved agronomy guidelines and disaster management recommendations.
   - If `GROQ_API_KEY` is present, dispatches to Groq's OpenAI-compatible completions API (`llama-3.3-70b-versatile`).
   - If no key is set or the call fails, `_build_fallback_response()` synthesizes a structured response from `kb.json` and active metrics.

---

## 4. Files Added and Modified

### Added Files

| File Path | Description |
|---|---|
| `backend/analysis.py` | EuroSAT classification pipeline (`mrm8488/convnext-tiny-finetuned-eurosat`), heuristic surface calculation, and KB lookup functions. |
| `backend/chat.py` | Multi-turn chat controller, prompt builder, Groq/Cerebras HTTP client, and deterministic fallback engine. |
| `backend/kb.json` | Structured domain knowledge base containing agronomical recommendations and disaster management guidelines for all 10 EuroSAT classes. |
| `frontend/src/components/LandCoverAnalysis.jsx` | Step 06 overview component displaying primary classification, confidence, top-3 class bar chart, and heuristic meters. |
| `frontend/src/components/DeepAnalysisPage.jsx` | Subpage view providing full 10-class distribution, tabbed agronomy/disaster cards, and the docked AI assistant. |
| `frontend/src/components/ClassBarChart.jsx` | Reusable Recharts component for horizontal bar visualization of class probabilities. |
| `frontend/src/components/ChatBot.jsx` | Earth Observation AI Assistant interface with quick prompt pills, session reset, and message history. |

### Modified Files

| File Path | Nature of Changes |
|---|---|
| `backend/main.py` | Pre-loads EuroSAT classifier during startup lifespan; adds `POST /analyze` and `POST /chat` endpoints; updates root status endpoint. |
| `backend/requirements.txt` | Added `transformers`, `requests`, and `python-dotenv`. |
| `frontend/package.json` | Added `recharts` (`^2.15.1`). |
| `frontend/src/App.jsx` | Integrated `LandCoverAnalysis` under Step 06; added `analysisMap` state and automatic `/analyze` dispatching for both preset scenes and custom uploads; removed mock placeholders. |

---

## 5. Prerequisites & Local Installation

### System Requirements
* **Operating System:** Windows 10/11, Ubuntu 20.04+, or macOS
* **Node.js:** v18.0.0 or higher
* **Python:** 3.10 or 3.11 (Python 3.10 recommended for PyTorch compatibility)
* **Git**

---

### Step 1: Clone and Checkout Branch

```bash
git clone <REPO_URL>
cd SIH
git checkout srm-dashboard-rag-agent
```

---

### Step 2: Backend Setup

1. Open a terminal in the project root and navigate to `backend/`:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   * **Windows (PowerShell):**
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   * **Linux / macOS:**
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. Install required Python packages:
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

   *(Note: The first time `analysis.py` runs, it will automatically download the lightweight `mrm8488/convnext-tiny-finetuned-eurosat` Hugging Face weights (~110MB).)*

4. Configure the Environment Variables (see Section 6 for details):
   Copy `backend/.env.example` to `backend/.env`:
   ```bash
   cp backend/.env.example backend/.env
   # Or on Windows PowerShell:
   # Copy-Item backend/.env.example backend/.env
   ```
   Add your Groq API key:
   ```bash
   # Inside backend/.env
   LLM_PROVIDER=groq
   GROQ_API_KEY=your_groq_api_key_here
   ```
   *(Note: Never commit or publicly share `backend/.env`)*

5. Start the FastAPI backend server:
   ```bash
   uvicorn main:app --reload --host 127.0.0.1 --port 8000
   ```
   *The backend will initialize SwinIR model weights and pre-load the EuroSAT classifier.*
   *Verify it is running by opening: `http://127.0.0.1:8000/` in your browser.*

---

### Step 3: Frontend Setup

1. Open a second terminal window and navigate to `frontend/`:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

4. Access the dashboard:
   Open **`http://localhost:5173`** (or the port indicated by Vite) in your browser.

---

## 6. Groq API Key Configuration & Behavior

The RAG Agent uses an OpenAI-compatible REST pattern executed via Python `requests`. It does not require heavyweight vendor SDKs.

### Configuration (`backend/.env`)

Copy `backend/.env.example` to `backend/.env` and supply your actual key:

```ini
# Select the active LLM provider ('groq' or 'cerebras')
LLM_PROVIDER=groq

# Your Groq API key (get one free at https://console.groq.com/keys)
GROQ_API_KEY=your_groq_api_key_here

# Optional overrides (defaults shown below)
# GROQ_MODEL=llama-3.3-70b-versatile
# GROQ_URL=https://api.groq.com/openai/v1/chat/completions
```

> **Security Reminder:** Never commit or publicly share `backend/.env`. It is ignored by `.gitignore`.

#### Key Sanitization
The backend automatically sanitizes keys:
- Trims whitespace.
- Strips wrapping quotes (`"..."` or `'...'`).
- Strips any accidental `"Bearer "` prefix.

---

### What Happens If No API Key Is Provided?

The application is built with a **robust deterministic fallback mechanism**:

1. **No Application Crash:** If `GROQ_API_KEY` is omitted, blank, invalid, or rate-limited, the `/chat` endpoint **does not throw a 500 error**.
2. **Logged Warning:** The backend prints:
   ```text
   [CHAT INFO] GROQ_API_KEY not configured. Serving grounded fallback response.
   ```
3. **Deterministic Synthesis (`_build_fallback_response`):**
   - The assistant analyzes the user's question keyword intent:
     - **Agronomy/Crops:** Injects verified agricultural recommendations from `kb.json` for the detected class and reports vegetation coverage %.
     - **Disasters/Hazards:** Injects hazard vulnerabilities, flood drainage advice, and firebreak recommendations from `kb.json`.
     - **General Overview:** Injects top recommendations from both domains with class confidence and surface coverage metrics.
   - Prepends the response with `[Offline Mode]`, ensuring transparency while providing instant, high-quality answers.
4. **Complete Offline Autonomy:** The EuroSAT classification, heuristics, 10-class distribution charts, and knowledge base guidelines operate 100% locally on your machine without requiring any internet connection after model download.

---

## 7. How to Operate the Application (User Guide)

### 1. Mission Control Landing
- Upon loading `http://localhost:5173`, you will see the **Mission Control HUD** with an interactive 3D WebGL globe.
- Click **"LAUNCH ANALYSIS"** or scroll down to the image workspace.

### 2. Selecting a Preset Scene
- In the top dataset bar, choose among preset Sentinel-2 scenes (e.g., `SCENE ALPHA // DELTA AGRICULTURAL SECTOR`, `SCENE BRAVO // PERI-URBAN INDUSTRIAL COMPLEX`, etc.).
- The dashboard immediately updates:
  - High-resolution Ground Truth reference imagery.
  - Bicubic upsampled baseline.
  - SwinIR 4× Super-Resolved reconstruction.
  - Live PSNR and SSIM benchmarks.

### 3. Comparing Image Quality
- Use the **Before / After interactive split slider** to inspect texture recovery, edge sharpness, and spatial clarity.
- Toggle **"ERROR HEATMAP (MAE)"** to view real-time pixel-by-pixel reconstruction error rendered across an HTML5 Canvas.

### 4. Uploading Custom Satellite Imagery
- Click the **"UPLOAD SATELLITE TILE"** button.
- Select a low-resolution satellite tile (PNG/JPG, under 512×512px).
- The backend runs SwinIR 4× super-resolution, calculates metrics, renders the enhanced image, and triggers EuroSAT analysis.

### 5. Viewing Land Cover Analysis (Step 06)
- Scroll to the **"LAND COVER ANALYSIS // SENTINEL-2 EUROSAT"** panel:
  - **Predicted Class & Confidence:** Displays the top classification (e.g., `PermanentCrop`, `AnnualCrop`, `Forest`, `Industrial`) with confidence score.
  - **Surface Coverage Heuristics:** Real-time gauges for **Vegetation %**, **Water %**, and **Urban %**.
  - **Top Class Probabilities:** Vertical bar chart ranking the top 3 class candidates.

### 6. Deep Analysis & AI Chat Assistant
- Click **"VIEW FULL ANALYSIS"** on the right side of the Land Cover card.
- This opens the comprehensive **Deep Analysis** view:
  - **Complete 10-Class Distribution:** Bar chart showing exact percentages for all 10 EuroSAT classes.
  - **Domain Insights Tabs:** Switch between **"CROP ANALYSIS & AGRONOMY"** (green) and **"DISASTER MANAGEMENT & RISK"** (orange) to view domain-specific intelligence.
  - **Provenance Banner:** Confirms model architecture, classes, and heuristic parameters.
  - **Earth Observation AI Assistant:** Located at the bottom of the page.

---

## 8. How to Test the AI Chat Functionality

Navigate to the **Deep Analysis** page and interact with the **AI Analysis Chat Agent**:

### Recommended Test Prompts

1. **Agronomy & Crop Suitability:**
   > *"What crops are best suited for this tile?"*
   - **Expected behavior:** The agent cites specific crops and soil/irrigation guidelines matching the active tile (e.g., cereal/legume rotation for `AnnualCrop`, orchards/vineyards for `PermanentCrop`).

2. **Disaster & Flood Risk:**
   > *"What are the primary disaster and flood risks?"*
   - **Expected behavior:** The agent details drainage vulnerabilities, flood sponge dynamics, or firebreak requirements tailored to the classification.

3. **Heuristic Metrics Inquiry:**
   > *"Explain the surface coverage heuristics."*
   - **Expected behavior:** The agent references the exact Vegetation %, Water %, and Urban % values shown in the HUD cards.

4. **Multi-Turn Context:**
   > Query 1: *"Is this area prone to waterlogging?"*
   > Query 2: *"What mitigation steps should local authorities take?"*
   - **Expected behavior:** The agent uses conversation history (up to 8 turns) to provide cohesive follow-up advice.

5. **Testing Offline Fallback:**
   - Temporarily comment out `GROQ_API_KEY` in `backend/.env` or set it to an invalid string.
   - Ask a question in the chat.
   - **Expected behavior:** The agent cleanly replies with an `[Offline Mode]` structured response grounded in the active classification metrics and `kb.json`.

---

## 9. Known Limitations & Troubleshooting

| Issue / Symptom | Root Cause | Solution |
|---|---|---|
| First `/analyze` request takes 10–20 seconds | Hugging Face is downloading the EuroSAT ConvNeXt model weights (~110MB) to local cache. | Wait for initial download to finish; all subsequent requests process in under 300ms. |
| Upload returns `400: Image already appears to be high-resolution` | Input image exceeds 512×512px. Super-resolution is intended for low-res satellite tiles. | Use a lower-resolution satellite tile (e.g., 64×64 to 256×256 pixels). |
| Upload returns `400: Image too large for real-time demo` | Image dimension exceeds 2048px. | Scale the image down before uploading to prevent server VRAM exhaustion. |
| Chat replies with `[Offline Mode]` | `GROQ_API_KEY` is missing or invalid in `backend/.env`, or `LLM_PROVIDER` is misconfigured. | Verify `backend/.env` has `LLM_PROVIDER=groq` and a valid `GROQ_API_KEY=your_groq_api_key_here`. Restart uvicorn after editing `.env`. |
| Port 8000 or 5173 already in use | Another instance of uvicorn or vite is running. | Kill existing processes or specify alternative ports (`--port 8001` for uvicorn, `--port 5174` for vite). |
| CORS errors in browser console | Frontend is attempting to connect to a host/port other than `http://127.0.0.1:8000`. | Ensure backend is running at `http://127.0.0.1:8000`. Backend has `allow_origins=["*"]` configured. |
