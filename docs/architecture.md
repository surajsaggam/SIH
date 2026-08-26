# Satellite Image Super-Resolution (SRM) - Architecture Overview

## 1. System Overview
The Satellite Image Super-Resolution Mapping (SRM) system enhances low-resolution satellite imagery (such as Sentinel-2) into high-resolution imagery using deep learning super-resolution techniques.

The system is organized into three decoupled, modular subsystems:

```
+------------------+         +--------------------+         +--------------------+
|  React Frontend  | <=====> |  FastAPI Backend   | <=====> |  ML Engine (PyTorch)|
| (Mission Control)|  REST   |  (API & Routing)   | Python  |  (Inference/Train) |
+------------------+         +--------------------+         +--------------------+
```

## 2. Directory Layout & Responsibilities

### `frontend/`
- **Purpose**: Interactive Web UI / Mission Control Dashboard.
- **Tech Stack**: React, Vite, Tailwind CSS, Lucide icons.
- **Modules**:
  - `components/`: Modular UI units (`UploadPanel`, `ImageComparer`, `MapViewer`, `MetricsPanel`, `Navbar`, `Sidebar`).
  - `pages/`: Page views (`Home`, `Dashboard`, `Results`).
  - `services/`: API integration layer for communicating with backend endpoints (`api.js`).
  - `context/`: React context providers for global state management.

### `backend/`
- **Purpose**: API gateway, job orchestration, and inference service coordinator.
- **Tech Stack**: FastAPI, Uvicorn, Pydantic.
- **Modules**:
  - `app/main.py`: Application entrypoint & middleware configuration.
  - `app/routes/`: Modular endpoints (`upload`, `infer`, `status`).
  - `app/services/`: ML client interface adapter (`ml_client.py`).
  - `app/models/`: Data schemas and request/response models.
  - `app/config.py`: Environment and service configuration.

### `ml/`
- **Purpose**: Core machine learning research, data processing, training, and inference pipelines.
- **Tech Stack**: PyTorch, TorchVision / custom super-resolution architectures.
- **Modules**:
  - `data/`: Raw and processed satellite image datasets (`raw/`, `processed/`).
  - `notebooks/`: Exploratory data analysis, prototyping, and experimentation.
  - `src/`: Core ML codebase (`dataset.py`, `model.py`, `losses.py`, `metrics.py`, `train.py`, `inference.py`, `config.py`).
  - `weights/`: Trained model weights, checkpoints, and export artifacts.

### `docs/`
- **Purpose**: System architecture, data flow diagrams, API specifications, and developer guides.

## 3. Data Flow
1. **Input**: User uploads low-resolution satellite imagery (or selects preloaded tiles).
2. **Preprocessing**: Backend validates image format and prepares tiles/tensors for model ingestion.
3. **Inference**: ML engine executes super-resolution model with configured scale factor (e.g., 4x).
4. **Metrics & Visualization**: Output imagery and quantitative metrics (PSNR, SSIM) are returned to the frontend for interactive split-view comparison and download.
