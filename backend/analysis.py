import os
import json
import numpy as np
from PIL import Image
from transformers import pipeline

# Global classifier reference
classifier = None

KB_PATH = os.path.join(os.path.dirname(__file__), "kb.json")
try:
    with open(KB_PATH, "r", encoding="utf-8") as f:
        KB = json.load(f)
except Exception as e:
    print(f"[ANALYSIS WARNING] Failed to load {KB_PATH}: {e}")
    KB = {}

def get_classifier():
    """
    Returns the loaded EuroSAT classifier pipeline, initializing it if not yet loaded.
    """
    global classifier
    if classifier is None:
        print("[ANALYSIS] Loading EuroSAT classifier (mrm8488/convnext-tiny-finetuned-eurosat)...")
        from transformers import AutoImageProcessor, AutoModelForImageClassification
        model_name = "mrm8488/convnext-tiny-finetuned-eurosat"
        image_processor = AutoImageProcessor.from_pretrained(model_name)
        if getattr(image_processor, "crop_pct", None) is None:
            image_processor.crop_pct = 224 / 256  # 0.875 standard ConvNeXt crop percentage
        model = AutoModelForImageClassification.from_pretrained(model_name)
        classifier = pipeline(
            "image-classification",
            model=model,
            image_processor=image_processor
        )
        print("[ANALYSIS] EuroSAT classifier initialized successfully.")
    return classifier

def heuristics(img: Image.Image):
    """
    Lightweight rule-based heuristic computation for surface coverage percentages.
    """
    arr = np.array(img.resize((256, 256))).astype(float)
    r, g, b = arr[..., 0], arr[..., 1], arr[..., 2]
    
    # Vegetation index proxy (green channel prominence)
    veg = float(np.mean((2 * g - r - b) > 15) * 100)
    
    # Water index proxy (blue channel dominance and brightness threshold)
    water = float(np.mean((b > r) & (b > g) & (b > 90)) * 100)
    
    # Urban index proxy (low spectral saturation, moderate brightness)
    urban = float(np.mean((np.abs(r - g) < 15) & (np.abs(g - b) < 15) & (r > 100) & (r < 200)) * 100)
    
    return {
        "vegetation_pct": round(veg, 1),
        "water_pct": round(water, 1),
        "urban_pct": round(urban, 1)
    }

def analyze(img: Image.Image):
    """
    Analyzes a super-resolved or satellite image:
    1. Classifies land cover using EuroSAT ConvNeXt model.
    2. Computes vegetation, water, and urban coverage heuristics.
    3. Retrieves domain suggestions (crop analysis & disaster management) from KB.
    """
    clf = get_classifier()
    # Ensure RGB
    if img.mode != "RGB":
        img = img.convert("RGB")
        
    preds = clf(img.resize((224, 224)), top_k=10)  # all 10 EuroSAT classes sorted desc
    top = preds[0]
    top_label = top["label"]
    
    class_probs = {p["label"]: round(float(p["score"]) * 100, 1) for p in preds}
    
    return {
        "label": top_label,
        "confidence": round(float(top["score"]) * 100, 1),
        "class_probs": class_probs,
        **heuristics(img),
        "suggestions": KB.get(top_label, {
            "icon": "Layers",
            "display_name": top_label,
            "crop_analysis": ["Monitor crop parameters and soil consistency."],
            "disaster_management": ["Assess area drainage and slope stability."]
        })
    }
