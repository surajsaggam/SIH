# SIH PS 26142 - Super Resolution Mapping Demo

This repository contains the prototype dashboard for the SIH PS 26142 project (AI-based super-resolution of Sentinel-2 satellite imagery). 
It features a "Mission Control" aesthetic built with React, Vite, and Tailwind CSS v4, along with a mock FastAPI backend ready for Real-ESRGAN integration.

## Project Structure
- `/frontend`: React + Vite single page application
- `/backend`: FastAPI backend

## Prerequisites
- Node.js (v18+)
- Python 3.10+

## 1. Running the Backend
The backend serves the mock `/enhance` endpoint.
```bash
cd backend
python -m venv venv
# Windows
.\venv\Scripts\activate
# Linux/Mac
# source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
The API will be available at `http://localhost:8000`

## 2. Running the Frontend
The frontend loads pre-computed telemetry from `/public/results.csv` and sample images.
```bash
cd frontend
npm install
npm run dev
```
The app will be available at `http://localhost:5173`

## Known Issues / Next Steps
- The backend `/enhance` endpoint currently just resizes the image by 4x. GPU inference integration for Real-ESRGAN is pending.
- Upload functionality in the frontend UI is currently a mockup and needs to be wired to the `/enhance` endpoint.
- To use your own outputs, replace the dummy images (`sample_X_input.png`, `sample_X_output.png`, `sample_X_reference.png`) and update `results.csv` in the `frontend/public` directory.