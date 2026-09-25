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
The backend serves the SwinIR super-resolution, EuroSAT land-cover analysis, and RAG chat agent.

### Environment & LLM Configuration
1. Navigate to `backend/` and copy the environment template:
   ```bash
   cd backend
   cp .env.example .env
   # On Windows PowerShell:
   # Copy-Item .env.example .env
   ```
2. Obtain a free Groq API key at [https://console.groq.com/keys](https://console.groq.com/keys).
3. Put your key in `backend/.env`:
   ```env
   LLM_PROVIDER=groq
   GROQ_API_KEY=your_groq_api_key_here
   ```
   > **Important Security Rule:** Never commit or publicly share `backend/.env`. It is ignored by `.gitignore`.

### Start the Server
```bash
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/Mac:
# source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
The API will be available at `http://localhost:8000` (FastAPI Swagger docs at `http://localhost:8000/docs`).

## 2. Running the Frontend
The frontend is a React + Vite application with interactive super-resolution comparison, land-cover classification, and AI analysis chat.
```bash
cd frontend
npm install
npm run dev
```
The app will be available at `http://localhost:5173`.