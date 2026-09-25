# Implementation Plan — Land Cover Analysis Agent
### Feature branch of: SIH Satellite Super-Resolution (SwinIR)

---

## 1. Objective

After a user uploads a low-res Sentinel-2 tile and SwinIR produces the HR output, automatically:
1. Classify the land-cover type of the HR image using a pretrained model (no training).
2. Compute supplementary vegetation/water/urban coverage stats via lightweight heuristics.
3. Surface domain-specific suggestions (crop analysis / disaster management) from a static knowledge base keyed to the classified land type — this path never depends on the LLM, so the app stays fully useful even if the chat API is down or slow.
4. Let the user ask follow-up questions about the analysis via a chat interface backed by a free, fast LLM (Cerebras), called with plain `requests` (no SDK), with rolling conversation memory — no vector DB, no embeddings, no fine-tuning.

**Priority order:** classifier + KB output is the source of truth and renders instantly, synchronously, with zero external dependency. The Cerebras chat is a bolt-on for free-text Q&A only — if it fails, the demo still shows a fully correct analysis.

Constraint: this is a hackathon MVP. Every choice below optimizes for "works reliably in a live demo, buildable in hours" over production-grade robustness.

---

## 2. Reference Links

| Purpose | Link |
|---|---|
| Land-cover classifier (pretrained, ready to use) | https://huggingface.co/mrm8488/convnext-tiny-finetuned-eurosat |
| EuroSAT dataset (what the classifier was trained on — same Sentinel-2 source) | https://github.com/phelber/EuroSAT |
| HF `transformers` pipeline docs | https://huggingface.co/docs/transformers/main_classes/pipelines |
| Cerebras API quickstart | https://inference-docs.cerebras.ai/quickstart |
| Cerebras chat completions API reference (OpenAI-compatible, plain REST) | https://inference-docs.cerebras.ai/api-reference/chat-completions |
| Cerebras available models | https://inference-docs.cerebras.ai/models |
| Recharts (frontend charts) | https://recharts.org/en-US/ |
| lucide-react icons (already in stack) | https://lucide.dev/icons/ |

---

## 3. Architecture Flow

```
User uploads LR image
        │
        ▼
POST /enhance  (existing SwinIR endpoint) → HR image (base64)
        │
        ▼
POST /analyze  (NEW) → same HR image →
    ├─ HF classifier (convnext-tiny-finetuned-eurosat) → label + class_probs
    ├─ heuristics.py → vegetation_pct / water_pct / urban_pct
    └─ KB.json lookup on label → suggestions
        │
        ▼
Frontend renders: bar chart (class_probs) + stat cards + suggestion list
        │
        ▼
POST /chat (NEW) → {session_id, question} + analysis JSON + rolling window
        → raw HTTP POST to Cerebras /v1/chat/completions → answer rendered in chat panel
        → on failure/timeout: fall back to "here's the analysis" canned reply, classifier/KB output is untouched
```

No vector store, no chunking, no fine-tuning, no LLM SDK anywhere in this pipeline.

---

## 4. Backend Implementation

### 4.1 Dependencies
Add to `backend/requirements.txt`:
```
transformers
requests
```
(`torch`, `Pillow`, `numpy` already present. No LLM SDK — Cerebras is called via plain `requests` against its OpenAI-compatible REST endpoint.)

Env var needed: `CEREBRAS_API_KEY` (free tier, get from https://cloud.cerebras.ai)

### 4.2 New file: `backend/analysis.py`
```python
from transformers import pipeline
from PIL import Image
import numpy as np
import json, os

classifier = pipeline("image-classification", model="mrm8488/convnext-tiny-finetuned-eurosat")

KB_PATH = os.path.join(os.path.dirname(__file__), "kb.json")
with open(KB_PATH) as f:
    KB = json.load(f)

def heuristics(img: Image.Image):
    arr = np.array(img.resize((256, 256))).astype(float)
    r, g, b = arr[..., 0], arr[..., 1], arr[..., 2]
    veg = np.mean((2 * g - r - b) > 15) * 100
    water = np.mean((b > r) & (b > g) & (b > 90)) * 100
    urban = np.mean((np.abs(r - g) < 15) & (np.abs(g - b) < 15) & (r > 100) & (r < 200)) * 100
    return {"vegetation_pct": round(veg, 1), "water_pct": round(water, 1), "urban_pct": round(urban, 1)}

def analyze(img: Image.Image):
    preds = classifier(img.resize((224, 224)))  # sorted desc by score
    top = preds[0]
    return {
        "label": top["label"],
        "confidence": round(top["score"] * 100, 1),
        "class_probs": {p["label"]: round(p["score"] * 100, 1) for p in preds},
        **heuristics(img),
        "suggestions": KB.get(top["label"], {}),
    }
```

### 4.3 New file: `backend/kb.json`
10 keys — one per EuroSAT class (`AnnualCrop`, `PermanentCrop`, `Pasture`, `HerbaceousVegetation`, `Forest`, `River`, `SeaLake`, `Highway`, `Industrial`, `Residential`). Each key: `{"icon": "...", "crop_analysis": [...], "disaster_management": [...]}`. (Draft content already produced in this conversation — Claude Code should populate all 10 fully before demo.)

### 4.4 New file: `backend/chat.py`
No SDK — a single `requests.post` against Cerebras's OpenAI-compatible endpoint. If it fails (timeout, rate limit, no wifi), fall back to a canned reply built straight from the classifier/KB output so the demo never dead-ends.
```python
from collections import deque
import os, requests

CEREBRAS_URL = "https://api.cerebras.ai/v1/chat/completions"
CEREBRAS_KEY = os.environ["CEREBRAS_API_KEY"]
sessions: dict[str, deque] = {}

def _fallback(analysis: dict) -> str:
    top = analysis.get("label", "unknown")
    tips = analysis.get("suggestions", {})
    lines = [f"Assistant unavailable right now — here's the analysis directly: {top}."]
    for section, items in tips.items():
        if items:
            lines.append(f"{section}: {items[0]}")
    return " ".join(lines)

def chat(session_id: str, question: str, analysis: dict):
    history = sessions.setdefault(session_id, deque(maxlen=8))
    system = (
        "You are a satellite imagery analysis assistant. "
        f"Current analysis: {analysis}. "
        "Answer questions using this data. Be concise and specific."
    )
    messages = [{"role": "system", "content": system}] + list(history) + [
        {"role": "user", "content": question}
    ]
    try:
        resp = requests.post(
            CEREBRAS_URL,
            headers={"Authorization": f"Bearer {CEREBRAS_KEY}", "Content-Type": "application/json"},
            json={"model": "llama3.1-8b", "messages": messages},
            timeout=8,
        )
        resp.raise_for_status()
        answer = resp.json()["choices"][0]["message"]["content"]
    except Exception:
        answer = _fallback(analysis)

    history.append({"role": "user", "content": question})
    history.append({"role": "assistant", "content": answer})
    return answer
```

### 4.5 Wire into `backend/main.py`
```python
from analysis import analyze
from chat import chat as run_chat
from PIL import Image
import io

@app.post("/analyze")
async def analyze_route(file: UploadFile = File(...)):
    img = Image.open(io.BytesIO(await file.read())).convert("RGB")
    return analyze(img)

@app.post("/chat")
async def chat_route(payload: dict):
    return {"answer": run_chat(payload["session_id"], payload["question"], payload["analysis"])}
```

Frontend calls `/analyze` right after `/enhance` resolves, passing the same HR image (as a blob) so the user never re-uploads.

---

## 5. Frontend Implementation

### 5.1 Two subpages, not one crowded panel
Splitting kills the clutter problem outright — each page has one job and one screen's worth of content.

```
frontend/src/components/
├── OverviewPage.jsx        # subpage 1: the "at a glance" result
├── DeepAnalysisPage.jsx    # subpage 2: full breakdown + suggestions + chat
├── ClassBarChart.jsx       # shared: top-N bar chart, N passed as prop (3 for overview, 10 for deep)
└── ChatBot.jsx             # lives only on DeepAnalysisPage
```

- **OverviewPage** — top predicted label large + confidence, top-3 class bar chart (not all 10), the three stat cards (vegetation/water/urban), and a single "View full analysis →" button. This is what's on screen the instant `/analyze` returns — nothing else competing for attention.
- **DeepAnalysisPage** — full 10-class bar chart, the two-tab Suggestions panel (Crop Analysis / Disaster Management), and the ChatBot docked at the bottom. Reached via the button on Overview, or a tab switcher at the top of the results section.

Use a simple local tab/route toggle (`useState` on `App.jsx`, or `react-router` if already in the stack) — no need for a real router just for two views.

### 5.2 Data flow
`App.jsx` already holds HR image state after `/enhance`. Add:
```js
const [analysis, setAnalysis] = useState(null);
const [view, setView] = useState('overview'); // 'overview' | 'deep'
// after enhance succeeds:
const res = await fetch('http://127.0.0.1:8000/analyze', { method: 'POST', body: formData });
setAnalysis(await res.json());
```
Pass `analysis` down to whichever page is active; `ChatBot` only mounts on `DeepAnalysisPage` and needs `analysis` as context on every message.

### 5.3 Charting
Use `recharts` (`npm install recharts`) — already compatible with the existing React 19 + Vite setup.
- `ClassBarChart` takes `topN` — Overview passes `3`, DeepAnalysis passes `10`. Same component, no duplicated chart code.
- `vegetation_pct / water_pct / urban_pct` → three stat cards with a small radial/gauge indicator each, shown on Overview only (they're the "at a glance" numbers).

---

## 6. Frontend Design Prompt

Use this as the brief for Claude Code / frontend-design work on the new panels:

> Design a satellite-analysis results section that sits below the existing SwinIR comparison viewport, matching the app's existing dark, technical "mission control" aesthetic (bounding-box UI, telemetry styling). Split it across two subpages rather than one crowded panel:
>
> **Page 1 — Overview.** The predicted land-cover label shown large and bold with its confidence %, a compact horizontal bar chart (recharts) showing only the top 3 class probabilities (not all 10 — keep it scannable), and three stat cards below (Vegetation / Water / Urban) each with a percentage, a small icon (lucide-react: leaf, droplet, building), and a thin radial or linear progress indicator. End with a single clear "View full analysis →" call-to-action.
>
> **Page 2 — Deep Analysis**, reached via that CTA or a tab switcher at the top of the results section. Contains the full 10-class bar chart (same component as Overview, just given all 10 classes instead of 3), a two-tab Suggestions panel ("Crop Analysis" / "Disaster Management") pulling directly from the KB response as short actionable cards (not paragraphs), and a chat panel docked at the bottom where the user can ask follow-up questions grounded in the displayed data.
>
> Use a subtle animated transition between the two pages (slide or fade) so it reads as one continuous experience, not two disconnected screens. Reuse the existing globe/telemetry color palette and monospace/technical type treatment already established in `GlobeHero.jsx` and `SystemTelemetry.jsx` — don't introduce a new design language.

---

## 7. Task Checklist for Claude Code

- [ ] `pip install transformers requests` in backend env (no LLM SDK)
- [ ] Add `CEREBRAS_API_KEY` to backend `.env`
- [ ] Create `backend/analysis.py`, `backend/kb.json` (fill all 10 KB entries), `backend/chat.py` (raw `requests` call + fallback)
- [ ] Add `/analyze` and `/chat` routes to `backend/main.py`; load classifier in the existing `@asynccontextmanager lifespan` alongside SwinIR
- [ ] `npm install recharts` in frontend
- [ ] Build `ClassBarChart.jsx` (shared, `topN` prop), `OverviewPage.jsx`, `DeepAnalysisPage.jsx`, `ChatBot.jsx` per section 5
- [ ] Wire `/analyze` call into `App.jsx` right after `/enhance` resolves (same image, no re-upload); add `view` state toggle between the two subpages
- [ ] Style per section 6 design prompt, reusing existing telemetry/globe visual language
- [ ] Smoke test: upload → enhance → analyze → verify Overview renders instantly, Deep Analysis tab shows full chart/suggestions/chat, and chat degrades gracefully with Cerebras unreachable (kill network, confirm fallback message appears)
