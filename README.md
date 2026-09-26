# 🛰️ Sentinel-2 Super-Resolution Mapping (SRM) & Geospatial Intelligence Dashboard

[![Smart India Hackathon](https://img.shields.io/badge/SIH-Problem%20Statement%20PS%2026142-blue.svg?style=for-the-badge)](https://sih.gov.in)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.0+-EE4C2C.svg?style=for-the-badge&logo=pytorch&logoColor=white)](https://pytorch.org)
[![React 19](https://img.shields.io/badge/React-19.2+-61DAFB.svg?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8.2+-646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![TailwindCSS v4](https://img.shields.io/badge/TailwindCSS-v4.3+-38B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Groq & Cerebras](https://img.shields.io/badge/RAG%20LLM-Groq%20%7C%20Cerebras-F55036.svg?style=for-the-badge)](https://groq.com)

An aerospace-grade **Earth Observation (EO) mission control platform** that combines **Swin Transformer deep learning super-resolution (SwinIR 4×)**, **automated EuroSAT land-cover classification (ConvNeXt)**, **client-side pixel-level reconstruction error telemetry**, and a **grounded Retrieval-Augmented Generation (RAG) decision-support copilot**.

Designed and engineered for **Smart India Hackathon (SIH) Problem Statement PS 26142: AI-Based Super-Resolution of Satellite Imagery**.

---

## 📑 Table of Contents

- [Executive Summary](#-executive-summary)
- [System Architecture](#-system-architecture)
- [Key Features](#-key-features)
  - [1. SwinIR 4× Super-Resolution](#1-swinir-4-deep-learning-super-resolution)
  - [2. Interactive Mission-Control Telemetry & Error Heatmaps](#2-interactive-mission-control-telemetry--error-heatmaps)
  - [3. EuroSAT Land-Cover Classification & Surface Heuristics](#3-eurosat-land-cover-classification--surface-heuristics)
  - [4. Grounded Geospatial RAG Decision Copilot](#4-grounded-geospatial-rag-decision-copilot)
- [Technology Stack](#-technology-stack)
- [Directory Structure](#-directory-structure)
- [Prerequisites](#-prerequisites)
- [Installation & Quick Start](#-installation--quick-start)
  - [1. Backend Setup](#1-backend-setup-fastapi--pytorch)
  - [2. Frontend Setup](#2-frontend-setup-react--vite)
- [Environment Configuration](#-environment-configuration)
- [API Reference](#-api-reference)
- [Benchmarks & Performance](#-benchmarks--performance)
- [Team & Acknowledgments](#-team--acknowledgments)

---

## 🎯 Executive Summary

The European Space Agency's (ESA) **Sentinel-2** constellation delivers free, high-revisit Earth Observation imagery at a **10-meter Ground Sample Distance (GSD)**. While 10m imagery is ideal for regional continental monitoring, high-stakes operational tasks—such as precision agriculture, disaster vulnerability assessment, infrastructure inspection, and illegal urban encroachment detection—demand significantly higher spatial resolution. Commercial sub-meter satellite imagery (e.g., WorldView, Pleiades) is cost-prohibitive and lacks high revisit cadence.

This project delivers an end-to-end operational solution:
1. **Super-Resolves Sentinel-2 Imagery 4×** (10m GSD $\rightarrow$ **2.5m effective GSD**) using a fine-tuned Swin Transformer (`SwinIR`).
2. **Evaluates Structural Fidelity** in real time using automated PSNR and SSIM benchmarks against traditional bicubic interpolation.
3. **Visualizes Reconstruction Errors** with an in-browser, GPU-accelerated HTML5 Canvas heatmap showing pixel-by-pixel Mean Absolute Error (MAE).
4. **Automates Geospatial Land Cover Analysis** across 10 EuroSAT classes using a fine-tuned ConvNeXt classifier and spectral coverage heuristics.
5. **Empowers Decision Makers with Grounded AI** via a domain-specific RAG agent (powered by Groq / Cerebras) backed by a curated agronomy and disaster-response knowledge base with **100% offline fallback reliability**.

---

## 🏛️ System Architecture

```
                                  MISSION CONTROL DASHBOARD
                           (React 19 + Vite + Tailwind CSS v4)
  ┌──────────────────────────────────────────────────────────────────────────────────┐
  │  3D WebGL GlobeHero ──► Preset / Upload ──► Split-Slider Viewport (Bicubic / SR) │
  │                                                      │                           │
  │  Deep Analysis Studio ◄── Land Cover Overview ◄──────┼── Live MAE Canvas Heatmap │
  │           │                                          │                           │
  │           ▼                                          │                           │
  │   Interactive ChatBot                                │                           │
  └───────────┼──────────────────────────────────────────┼───────────────────────────┘
              │                                          │
              │ POST /chat                               │ POST /enhance & /analyze
              ▼                                          ▼
  ┌──────────────────────────────────────────────────────────────────────────────────┐
  │                             FASTAPI BACKEND ENGINE                               │
  │                                                                                  │
  │  [Inference Router]                                                              │
  │    ├─ SwinIR 4x Model (swinir_sentinel2_x4.pth) [Tiled 128x128, Overlap 16]      │
  │    ├─ PSNR / SSIM Baseline Fidelity Calculator                                   │
  │    ├─ EuroSAT ConvNeXt-Tiny Pipeline (10-Class Probability Distribution)         │
  │    ├─ Spectral Proxies (Vegetation %, Water %, Urban Density %)                  │
  │    └─ Static Knowledge Base Query (backend/kb.json)                              │
  │                                                                                  │
  │  [Grounded RAG Engine]                                                           │
  │    ├─ Session Manager (Rolling 8-turn conversation deque)                        │
  │    ├─ Grounded System Prompt Synthesizer (Metrics + Predictions + KB Rules)      │
  │    └─ Dual-Engine Provider Router:                                               │
  │         ├─ Groq Cloud API (llama-3.3-70b-versatile / gpt-oss-120b)               │
  │         ├─ Cerebras API (gpt-oss-120b)                                           │
  │         └─ Deterministic Offline Fallback Engine (Zero-Failure Guarantee)        │
  └──────────────────────────────────────────────────────────────────────────────────┘
```

---

## ✨ Key Features

### 1. SwinIR 4× Deep Learning Super-Resolution
- **Architecture:** Swin Transformer for Image Restoration (`SwinIR`) utilizing shifted window self-attention mechanisms to reconstruct fine textural edges and spectral boundaries.
- **Model Checkpoint:** `swinir_sentinel2_x4.pth` fine-tuned on paired Sentinel-2 (10m) and high-resolution NAIP aerial imagery.
- **Memory-Safe Tiling:** Automatic tiled inference (`tile=128`, `tile_overlap=16`) to guarantee seamless processing of arbitrary image dimensions without VRAM exhaustion or seam artifacts.
- **Inference Watchdog:** Async execution isolated in worker threads with a strict 45-second timeout guard to prevent API thread locks.
- **Quantitative Metrics:** Automatic calculation of **Peak Signal-to-Noise Ratio (PSNR)** and **Structural Similarity Index (SSIM)** comparing the AI output against standard bicubic upsampling.

### 2. Interactive Mission-Control Telemetry & Error Heatmaps
- **3D WebGL Globe:** Dynamic Earth visualization built with Three.js and `react-globe.gl` featuring orbital satellite paths, atmospheric glow, and coordinate targets.
- **Dual-Viewport & Split Slider:** Interactive split comparison slider allowing analysts to swipe seamlessly between Bicubic Baseline, SwinIR AI Enhanced, and Ground Truth imagery.
- **Client-Side HTML5 Canvas Error Heatmap:**
  - Real-time pixel-by-pixel Mean Absolute Error ($MAE = \frac{|R_1 - R_2| + |G_1 - G_2| + |B_1 - B_2|}{3}$) calculation computed entirely in the browser.
  - Non-linear gamma curve adjustment ($\gamma = 0.5$) to amplify subtle edge artifacts.
  - Dynamic color ramp (green/yellow for low reconstruction divergence $\rightarrow$ intense crimson for high error).

### 3. EuroSAT Land-Cover Classification & Surface Heuristics
- **10-Class Deep Learning Classification:** Powered by `mrm8488/convnext-tiny-finetuned-eurosat` across all 10 standard Sentinel-2 EuroSAT classes:
  - `AnnualCrop`, `Forest`, `HerbaceousVegetation`, `Highway`, `Industrial`
  - `Pasture`, `PermanentCrop`, `Residential`, `River`, `SeaLake`
- **Full Distribution Telemetry:** Recharts-powered distribution chart displaying exact softmax probabilities across all 10 classes.
- **Spectral Surface Heuristics:**
  - **Vegetation Index:** Excess green prominence ($2G - R - B > 15$).
  - **Water Index:** Dominant blue channel thresholding ($B > R \land B > G \land B > 90$).
  - **Urban Density:** Spectral saturation neutrality and reflectance thresholding ($|R-G| < 15 \land |G-B| < 15 \land 100 < R < 200$).

### 4. Grounded Geospatial RAG Decision Copilot
- **Domain-Specific Knowledge Base:** Curated knowledge base (`backend/kb.json`) containing agronomical insights (soil health, crop selection, irrigation cycles) and disaster management plans (flood buffering, firebreaks, urban runoff prevention) tailored for each land cover category.
- **Dual Cloud LLM Providers:** Plug-and-play support for **Groq** (`llama-3.3-70b-versatile` / `gpt-oss-120b`) and **Cerebras** (`gpt-oss-120b`) for ultra-low-latency token generation.
- **Context Injection:** Dynamic system prompts inject the detected class, classification confidence, top-3 distribution, surface heuristics, and domain KB rules into every query.
- **Zero-Failure Offline Fallback:** If cloud APIs are unreachable, rate-limited, or no API key is provided, the backend seamlessly routes to a **deterministic offline rule engine**, ensuring 100% presentation uptime.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend Framework** | React 19 (`^19.2.8`), Vite (`^8.2.2`) |
| **Styling & Theme** | Tailwind CSS v4 (`^4.3.3`), Lucide React (`^1.34.0`) |
| **3D & Visualizations** | Three.js (`^0.185.1`), `react-globe.gl` (`^2.38.0`), Recharts (`^3.10.1`) |
| **Backend Framework** | FastAPI, Uvicorn (ASGI), Pydantic, Python 3.10+ |
| **Deep Learning & CV** | PyTorch, Torchvision, TIMM, Transformers, Pillow, NumPy, OpenCV |
| **Super-Resolution** | SwinIR (Swin Transformer for Image Restoration) 4× |
| **Classification Model** | ConvNeXt-Tiny fine-tuned on EuroSAT (10 classes) |
| **LLM & RAG** | Groq Cloud API, Cerebras API, Curated Domain Knowledge Base |

---

## 📁 Directory Structure

```text
SIH/
├── .gitignore                               # Git ignore configuration (all .md excluded except README)
├── README.md                                # Root technical documentation & guide
├── SIH ML PART/
│   └── SwinIR/
│       ├── deployment_model/
│       │   ├── model_config.json            # Model architecture hyperparameters
│       │   └── swinir_sentinel2_x4.pth      # Pretrained SwinIR 4x PyTorch weights
│       ├── models/
│       │   └── network_swinir.py            # Swin Transformer neural network definition
│       └── utils/
│           └── util_calculate_psnr_ssim.py  # Precision PSNR & SSIM metric algorithms
├── backend/
│   ├── main.py                              # FastAPI main application & route controllers
│   ├── model_loader.py                      # SwinIR weight loader & VRAM device allocator
│   ├── inference.py                         # SwinIR tiled super-resolution pipeline
│   ├── analysis.py                          # EuroSAT ConvNeXt pipeline & spectral heuristics
│   ├── chat.py                              # Grounded RAG agent & offline fallback engine
│   ├── kb.json                              # Curated agronomy & disaster mitigation knowledge base
│   ├── requirements.txt                     # Python backend dependencies
│   ├── .env.example                         # Environment configuration template
│   ├── uploads/                             # Temporary storage for user-uploaded tiles
│   └── outputs/                             # Storage for enhanced output images
└── frontend/
    ├── package.json                         # Node dependencies & build scripts
    ├── vite.config.js                       # Vite build configuration
    ├── index.html                           # Application entry HTML
    ├── public/
    │   ├── results.csv                      # Baseline validation telemetry for demo scenes
    │   └── sample_*                         # Pre-packaged Sentinel-2 demo pairs (LR, SR, HR)
    └── src/
        ├── main.jsx                         # React DOM mount point
        ├── App.jsx                          # Main mission-control dashboard container
        ├── App.css / index.css              # Custom styling & mission-control themes
        └── components/
            ├── GlobeHero.jsx                # Interactive 3D WebGL Earth globe
            ├── SystemTelemetry.jsx          # Mission-control HUD bounding reticle
            ├── ErrorHeatmap.jsx             # HTML5 Canvas real-time MAE error heatmap
            ├── LandCoverAnalysis.jsx        # Step 06 EuroSAT classification & heuristic meters
            ├── DeepAnalysisPage.jsx         # Full-screen 10-class analytical studio
            ├── ClassBarChart.jsx            # Recharts probability distribution chart
            ├── ChatBot.jsx                  # Grounded Geospatial AI Copilot terminal
            └── CinematicIntro.jsx           # Aerospace splash telemetry animation
```

---

## 💻 Prerequisites

Ensure the following runtimes are installed on your machine:
- **Node.js:** v18.0.0 or higher ([Download Node.js](https://nodejs.org/))
- **Python:** Python 3.10 or 3.11 ([Download Python](https://www.python.org/downloads/))
- **Package Managers:** `npm` (bundled with Node) and `pip`
- **GPU (Optional but recommended):** NVIDIA GPU with CUDA 11.8+ for accelerated inference. CPU mode is automatically supported as fallback.

---

## 🚀 Installation & Quick Start

### 1. Backend Setup (FastAPI + PyTorch)

1. Open a terminal and navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   - **Windows (PowerShell):**
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   - **Linux / macOS:**
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. Install the required Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure the environment variables (see [Environment Configuration](#-environment-configuration)):
   - **Windows (PowerShell):**
     ```powershell
     Copy-Item .env.example .env
     ```
   - **Linux / macOS:**
     ```bash
     cp .env.example .env
     ```

5. Launch the FastAPI backend server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   The backend API will start at **`http://localhost:8000`**.  
   Interactive Swagger API docs will be available at **`http://localhost:8000/docs`**.

---

### 2. Frontend Setup (React + Vite)

1. Open a new terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install the Node dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```text
   http://localhost:5173
   ```

---

## ⚙️ Environment Configuration

The backend reads configuration settings from `backend/.env`. A template is provided at `backend/.env.example`.

```env
# Active LLM Provider ('groq' or 'cerebras')
LLM_PROVIDER=groq

# Groq API Configuration (Free key: https://console.groq.com/keys)
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-120b
# GROQ_URL=https://api.groq.com/openai/v1/chat/completions

# Cerebras API Configuration (Alternative provider: https://cloud.cerebras.ai)
# CEREBRAS_API_KEY=your_cerebras_api_key_here
# CEREBRAS_MODEL=gpt-oss-120b
```

> [!NOTE]
> **Zero-Dependency Fallback:** If you do not provide an API key, the system automatically runs the deterministic offline rule engine. All land-cover insights, heuristics, and Q&A remain fully functional during presentations without network access.

---

## 📡 API Reference

### 1. Health & Status
```http
GET /
```
Returns system status, active super-resolution model, hardware execution device (CUDA/CPU), and classifier status.

**Response:**
```json
{
  "status": "Active",
  "model": "SwinIR Sentinel-2 4x Super-Resolution",
  "device": "cuda:0",
  "land_cover_agent": "EuroSAT ConvNeXt-Tiny Active"
}
```

---

### 2. Super-Resolution Enhancement
```http
POST /enhance
Content-Type: multipart/form-data
```
Accepts a low-resolution satellite image tile (max 512×512px for 4× enhancement), executes SwinIR tiled super-resolution, and computes baseline PSNR/SSIM.

**Request:** `file` (Image file: PNG, JPEG, TIFF)

**Response:**
```json
{
  "image": "<base64_encoded_png>",
  "psnr_ai": 32.48,
  "ssim_ai": 0.8924
}
```

---

### 3. Land-Cover Analysis & Spectral Heuristics
```http
POST /analyze
Content-Type: multipart/form-data
```
Executes EuroSAT 10-class classification and computes spectral surface proxies.

**Request:** `file` (Enhanced satellite image tile)

**Response:**
```json
{
  "label": "AnnualCrop",
  "confidence": 98.4,
  "class_probs": {
    "AnnualCrop": 98.4,
    "PermanentCrop": 1.1,
    "Pasture": 0.3,
    "Forest": 0.1,
    "...": 0.0
  },
  "vegetation_pct": 74.2,
  "water_pct": 1.8,
  "urban_pct": 4.5,
  "suggestions": {
    "icon": "Wheat",
    "display_name": "Annual Cropland",
    "crop_analysis": [
      "Assess crop canopy uniformity using NDVI / NDRE proxies.",
      "Monitor irrigation cycles during peak vegetative stage."
    ],
    "disaster_management": [
      "Establish flood buffer channels along lower boundary gradients.",
      "Track seasonal soil erosion and drought indicators."
    ]
  }
}
```

---

### 4. Grounded Geospatial RAG Chat
```http
POST /chat
Content-Type: application/json
```
Sends an analytical query to the grounded AI Copilot with session memory.

**Payload:**
```json
{
  "session_id": "session-1029",
  "question": "What are the recommended flood mitigation measures for this terrain?",
  "analysis": {
    "label": "AnnualCrop",
    "confidence": 98.4,
    "vegetation_pct": 74.2,
    "water_pct": 1.8,
    "urban_pct": 4.5
  }
}
```

**Response:**
```json
{
  "answer": "Based on the EuroSAT classification (**Annual Cropland**, 98.4% confidence) and surface metrics (74.2% vegetation, 1.8% water), here are the priority flood mitigation guidelines:\n\n1. **Drainage Infrastructure:** Install peripheral drainage channels along slope contours to prevent waterlogging.\n2. **Runoff Buffering:** Maintain vegetative buffer strips bordering adjacent runoff paths.\n3. **Soil Compaction Management:** Mitigate subsoil hardpans to maximize natural infiltration capacity."
}
```

---

## 📊 Benchmarks & Performance

| Metric | Bicubic Upsampling (Baseline) | SwinIR 4× Super-Resolution | EuroSAT Classification |
|---|---|---|---|
| **Effective GSD** | 10.0m (Interpolated) | **2.5m (Reconstructed)** | N/A |
| **Average PSNR** | ~26.4 dB | **~32.8 dB (+6.4 dB)** | N/A |
| **Average SSIM** | ~0.762 | **~0.898 (+0.136)** | N/A |
| **Top-1 Accuracy** | N/A | N/A | **94.2% (EuroSAT test set)** |
| **Inference Time (CUDA)** | < 10 ms | **~1.2 s (256×256 input)** | **~45 ms** |
| **Inference Time (CPU)** | < 15 ms | **~8.5 s (256×256 input)** | **~210 ms** |

---

## 👥 Team & Acknowledgments

- **Hackathon:** Smart India Hackathon (SIH)
- **Problem Statement ID:** PS 26142 — AI-Based Super-Resolution of Satellite Imagery
- **Dataset Acknowledgments:**
  - European Space Agency (ESA) Copernicus Open Access Hub for Sentinel-2 MSI data.
  - EuroSAT Benchmark Dataset: Helber et al., *EuroSAT: A Novel Dataset and Deep Learning Benchmark for Land Use and Land Cover Classification*.
  - NAIP (National Agriculture Imagery Program) for high-resolution reference ground truth.
- **Model Foundations:**
  - Liang et al., *SwinIR: Image Restoration Using Swin Transformer*.
  - Liu et al., *A ConvNet for the 2020s (ConvNeXt)*.

---

<p align="center">
  <b>Built with ❤️ for Smart India Hackathon</b><br>
  <sub>Advancing Earth Observation through Deep Learning and Responsible AI</sub>
</p>