import os
import json
from collections import deque
from typing import Dict, Any, Optional
import requests
from dotenv import load_dotenv

# Load local environment variables from .env if present
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

CEREBRAS_URL = os.environ.get("CEREBRAS_URL", "https://api.cerebras.ai/v1/chat/completions")
CEREBRAS_MODEL = os.environ.get("CEREBRAS_MODEL", "gpt-oss-120b")

# Groq configuration (switchable via LLM_PROVIDER=groq)
GROQ_URL = os.environ.get("GROQ_URL", "https://api.groq.com/openai/v1/chat/completions")
GROQ_MODEL = os.environ.get("GROQ_MODEL", "openai/gpt-oss-120b")

# Session history store: session_id -> deque of recent message dicts (max 8 messages)
sessions: Dict[str, deque] = {}

# Load static Knowledge Base
KB_PATH = os.path.join(os.path.dirname(__file__), "kb.json")
try:
    with open(KB_PATH, "r", encoding="utf-8") as f:
        KB = json.load(f)
except Exception as e:
    print(f"[CHAT WARNING] Failed to load {KB_PATH}: {e}")
    KB = {}

def get_kb_entry(label: Optional[str]) -> Dict[str, Any]:
    """
    Retrieve knowledge base record for a given land cover label.
    Supports exact match, whitespace normalization, and case-insensitive matching.
    """
    if not label:
        return {}
    if label in KB:
        return KB[label]
    
    clean_target = label.replace(" ", "").lower()
    for key, val in KB.items():
        if key.lower() == clean_target:
            return val
        if val.get("display_name", "").replace(" ", "").lower() == clean_target:
            return val
    return {}

def _build_fallback_response(analysis: Dict[str, Any], kb_entry: Dict[str, Any], question: str = "") -> str:
    """
    Deterministic fallback when Cerebras API is unreachable or not configured.
    Directly answers questions using the verified classifier and KB content.
    """
    if not analysis:
        return (
            "Assistant offline mode: No active satellite tile analysis is currently loaded. "
            "Please select a scene or upload an image to run EuroSAT land-cover analysis."
        )

    label = analysis.get("label", "Unknown")
    display_name = kb_entry.get("display_name", label)
    confidence = analysis.get("confidence", "N/A")
    crop_tips = kb_entry.get("crop_analysis", [])
    disaster_tips = kb_entry.get("disaster_management", [])
    veg = analysis.get("vegetation_pct", "N/A")
    water = analysis.get("water_pct", "N/A")
    urban = analysis.get("urban_pct", "N/A")

    q_lower = question.lower()
    
    # Agronomy / Crop focus
    if any(k in q_lower for k in ["crop", "farm", "agri", "plant", "soil", "harvest", "yield", "vegetation", "irrigation"]):
        lines = [
            f"[Offline Mode] Agronomic Assessment for {display_name} (Confidence: {confidence}%, Vegetation: {veg}%):"
        ]
        if crop_tips:
            for tip in crop_tips:
                lines.append(f"• {tip}")
        else:
            lines.append("• Continuous multispectral monitoring recommended for agricultural sectors.")
        return "\n".join(lines)

    # Disaster / Hazard focus
    if any(k in q_lower for k in ["disaster", "flood", "hazard", "risk", "damage", "fire", "emergency", "storm", "erosion", "waterlogging"]):
        lines = [
            f"[Offline Mode] Hazard & Risk Assessment for {display_name} (Confidence: {confidence}%):"
        ]
        if disaster_tips:
            for tip in disaster_tips:
                lines.append(f"• {tip}")
        else:
            lines.append("• Maintain baseline perimeter drainage and environmental buffers.")
        return "\n".join(lines)

    # General overview
    lines = [
        f"[Offline Mode] Verified Land Cover: {display_name} ({confidence}% confidence).",
        f"Surface Metrics: Vegetation {veg}%, Water {water}%, Urban {urban}%.",
        "",
        "Key Recommendations:",
        f"• Agronomy: {crop_tips[0] if crop_tips else 'Monitor field boundaries and vegetative vigor.'}",
        f"• Risk Mitigation: {disaster_tips[0] if disaster_tips else 'Assess local hydrology and slope integrity.'}"
    ]
    return "\n".join(lines)

def build_system_prompt(analysis: Dict[str, Any], kb_entry: Dict[str, Any]) -> str:
    """
    Constructs the RAG system prompt grounding the Cerebras model in:
    - Predicted EuroSAT class and confidence
    - Complete 10-class probability distribution
    - Lightweight surface heuristics (vegetation, water, urban)
    - Domain agronomical recommendations from kb.json
    - Disaster management and risk mitigation points from kb.json
    """
    if not analysis:
        return (
            "You are a satellite imagery analysis assistant. "
            "Currently, no image analysis data is available. "
            "Advise the user to select or upload an image first."
        )

    label = analysis.get("label", "Unknown")
    display_name = kb_entry.get("display_name", label)
    confidence = analysis.get("confidence", "N/A")
    veg = analysis.get("vegetation_pct", "N/A")
    water = analysis.get("water_pct", "N/A")
    urban = analysis.get("urban_pct", "N/A")
    
    # Class probabilities formatted
    class_probs = analysis.get("class_probs", {})
    probs_formatted = []
    if isinstance(class_probs, dict):
        sorted_probs = sorted(class_probs.items(), key=lambda x: x[1], reverse=True)
        probs_formatted = [f"{k}: {v}%" for k, v in sorted_probs]
    probs_str = ", ".join(probs_formatted) if probs_formatted else "N/A"

    # KB items formatted
    crop_tips = kb_entry.get("crop_analysis", [])
    crop_str = "\n".join(f"- {tip}" for tip in crop_tips) if crop_tips else "- No specific crop notes available."

    disaster_tips = kb_entry.get("disaster_management", [])
    disaster_str = "\n".join(f"- {tip}" for tip in disaster_tips) if disaster_tips else "- No specific disaster risk notes available."

    return (
        "You are the Sentinel-2 Satellite Land Cover & Earth Observation Analysis Assistant. "
        "You provide expert agronomy, environmental, and disaster management insights based strictly on the verified image inference and knowledge base data provided below.\n\n"
        "=== VERIFIED SATELLITE INFERENCE DATA ===\n"
        f"- Primary Land Cover Class: {label} ({display_name})\n"
        f"- Model Classification Confidence: {confidence}%\n"
        "- Surface Coverage Heuristics:\n"
        f"  * Vegetation Coverage Proxy: {veg}%\n"
        f"  * Water Surface Coverage Proxy: {water}%\n"
        f"  * Urban / Built-up Coverage Proxy: {urban}%\n"
        f"- Complete 10-Class EuroSAT Probabilities: {probs_str}\n\n"
        "=== RETRIEVED DOMAIN KNOWLEDGE BASE (KB) ===\n"
        "[Crop Analysis & Agronomy Guidelines]:\n"
        f"{crop_str}\n\n"
        "[Disaster Management & Risk Mitigation]:\n"
        f"{disaster_str}\n\n"
        "=== GROUNDING RULES ===\n"
        "1. Base your responses strictly on the verified inference data and domain knowledge base above.\n"
        "2. Do NOT invent, extrapolate, or hallucinate satellite findings, spectral bands, or sensor data that are not present.\n"
        "3. When answering agricultural or cultivation questions, cite the retrieved Crop Analysis guidelines.\n"
        "4. When answering questions regarding hazard vulnerabilities, floods, fires, or structural risks, cite the Disaster Management guidelines.\n"
        "5. If asked about unrelated topics, politely guide the user back to this satellite scene analysis.\n"
        "6. Keep your answers concise, clear, and actionable."
    )

def chat(session_id: Optional[str], question: str, analysis: Optional[Dict[str, Any]]) -> str:
    """
    Main chat handler.
    1. Retrieves KB information for the detected land cover class.
    2. Builds the grounded system prompt with analysis + KB.
    3. Calls Cerebras API using CEREBRAS_API_KEY.
    4. Falls back gracefully to deterministic KB synthesis if Cerebras is unreachable or unconfigured.
    """
    sid = session_id or "default"
    history = sessions.setdefault(sid, deque(maxlen=8))
    
    analysis_dict = analysis or {}
    label = analysis_dict.get("label")
    kb_entry = get_kb_entry(label)

    # Determine active LLM provider (default: cerebras)
    provider = os.environ.get("LLM_PROVIDER", "cerebras").strip().lower()
    if provider not in ["groq", "cerebras"]:
        provider = "cerebras"

    print(f"[CHAT] Provider: {provider}")

    system_prompt = build_system_prompt(analysis_dict, kb_entry)
    messages = [{"role": "system", "content": system_prompt}] + list(history) + [
        {"role": "user", "content": question}
    ]

    if provider == "groq":
        # Check for Groq API key and sanitize
        raw_key = os.environ.get("GROQ_API_KEY", "").strip()
        groq_key = raw_key
        if (groq_key.startswith('"') and groq_key.endswith('"')) or (groq_key.startswith("'") and groq_key.endswith("'")):
            groq_key = groq_key[1:-1].strip()
        if groq_key.lower().startswith("bearer "):
            groq_key = groq_key[7:].strip()

        if not groq_key or groq_key == "your_groq_api_key_here":
            print("[CHAT CONFIG ERROR] GROQ_API_KEY is missing or set to placeholder in backend/.env. "
                  "Please create backend/.env from backend/.env.example and set a valid API key from https://console.groq.com/keys.")
            print("[CHAT INFO] Serving grounded fallback response.")
            fallback_ans = _build_fallback_response(analysis_dict, kb_entry, question)
            history.append({"role": "user", "content": question})
            history.append({"role": "assistant", "content": fallback_ans})
            return fallback_ans

        # Safe debugging
        key_len = len(groq_key)
        masked_preview = f"{groq_key[:4]}...{groq_key[-4:]}" if key_len >= 8 else "(too short)"
        print(f"[GROQ DEBUG] Endpoint URL: {GROQ_URL}")
        print(f"[GROQ DEBUG] Model name: {GROQ_MODEL}")
        print(f"[GROQ DEBUG] Authorization header exists: True")
        print(f"[GROQ DEBUG] API key length: {key_len}")
        print(f"[GROQ DEBUG] API key preview (first/last 4 only): {masked_preview}")

        try:
            response = requests.post(
                GROQ_URL,
                headers={
                    "Authorization": f"Bearer {groq_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": GROQ_MODEL,
                    "messages": messages,
                    "temperature": 0.2,
                    "max_tokens": 512,
                },
                timeout=10,
            )
            response.raise_for_status()
            data = response.json()
            answer = data["choices"][0]["message"]["content"]
            print("[CHAT] Groq request succeeded.")
        except requests.exceptions.HTTPError as http_err:
            status_code = getattr(http_err.response, "status_code", "Unknown")
            resp_text = getattr(http_err.response, "text", "")
            print(f"[CHAT ERROR] Groq HTTP status: {status_code}")
            print(f"[CHAT ERROR] Groq response: {resp_text}")
            print("[CHAT] Falling back to grounded KB response.")
            answer = _build_fallback_response(analysis_dict, kb_entry, question)
        except Exception as e:
            print(f"[CHAT WARNING] Groq API call failed ({type(e).__name__}: {str(e)}). Falling back to grounded KB response.")
            answer = _build_fallback_response(analysis_dict, kb_entry, question)

    else:
        # Cerebras provider (default)
        raw_key = os.environ.get("CEREBRAS_API_KEY", "").strip()
        cerebras_key = raw_key
        if (cerebras_key.startswith('"') and cerebras_key.endswith('"')) or (cerebras_key.startswith("'") and cerebras_key.endswith("'")):
            cerebras_key = cerebras_key[1:-1].strip()
        if cerebras_key.lower().startswith("bearer "):
            cerebras_key = cerebras_key[7:].strip()

        if not cerebras_key:
            print("[CHAT INFO] CEREBRAS_API_KEY not configured. Serving grounded fallback response.")
            fallback_ans = _build_fallback_response(analysis_dict, kb_entry, question)
            history.append({"role": "user", "content": question})
            history.append({"role": "assistant", "content": fallback_ans})
            return fallback_ans

        # Safe debugging
        key_len = len(cerebras_key)
        masked_preview = f"{cerebras_key[:4]}...{cerebras_key[-4:]}" if key_len >= 8 else "(too short)"
        print(f"[CEREBRAS DEBUG] Endpoint URL: {CEREBRAS_URL}")
        print(f"[CEREBRAS DEBUG] Model name: {CEREBRAS_MODEL}")
        print(f"[CEREBRAS DEBUG] Authorization header exists: True")
        print(f"[CEREBRAS DEBUG] API key length: {key_len}")
        print(f"[CEREBRAS DEBUG] API key preview (first/last 4 only): {masked_preview}")

        try:
            response = requests.post(
                CEREBRAS_URL,
                headers={
                    "Authorization": f"Bearer {cerebras_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": CEREBRAS_MODEL,
                    "messages": messages,
                    "temperature": 0.2,
                    "max_tokens": 512,
                },
                timeout=10,
            )
            response.raise_for_status()
            data = response.json()
            answer = data["choices"][0]["message"]["content"]
            print("[CHAT] Cerebras request succeeded.")
        except requests.exceptions.HTTPError as http_err:
            status_code = getattr(http_err.response, "status_code", "Unknown")
            resp_text = getattr(http_err.response, "text", "")
            print(f"[CHAT ERROR] Cerebras HTTP status: {status_code}")
            print(f"[CHAT ERROR] Cerebras response: {resp_text}")
            print("[CHAT] Falling back to grounded KB response.")
            answer = _build_fallback_response(analysis_dict, kb_entry, question)
        except Exception as e:
            print(f"[CHAT WARNING] Cerebras API call failed ({type(e).__name__}: {str(e)}). Falling back to grounded KB response.")
            answer = _build_fallback_response(analysis_dict, kb_entry, question)

    history.append({"role": "user", "content": question})
    history.append({"role": "assistant", "content": answer})
    return answer
