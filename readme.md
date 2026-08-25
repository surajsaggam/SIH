# PS 26142 — Deep Learning Super Resolution Mapping (SRM) of Satellite Imagery
## Team Action Plan — Tue Night → Thu Internal Round

---

## 1. The Problem, In Plain Words

- Sentinel-2 satellite gives free global images, but resolution = **10m/pixel** (too blurry for small buildings, narrow roads, field edges, flood damage).
- Goal: use a **generative deep learning model** to turn that 10m image into a sharper image (**<4m**), while keeping colors/geography scientifically correct (not just "prettified").
- Must include: preprocessing → trained model (GAN / Transformer / Diffusion / CNN) → output image → **validation against real high-res reference** → uncertainty/error reporting.
- Applications to demo: crop monitoring, urban mapping, disaster/flood damage assessment.

**Judges will specifically look for:** is the sharpened detail *real* or *hallucinated*? How do you measure trust in the output? What real use case does it solve?

---

## 2. Recommended Tech Stack

| Layer | Tools |
|---|---|
| **Data source** | Sentinel Hub API, Google Earth Engine (GEE), Copernicus Open Access Hub (Sentinel-2 L2A) |
| **Preprocessing** | Python, `rasterio`, `GDAL`, `OpenCV`, cloud masking (Sen2Cor / SCL band), band stacking, patch tiling (e.g. 256×256) |
| **Reference/high-res data (for training pairs)** | Public paired datasets — no need to shoot your own: **WorldStrat**, **SEN2VENµS**, **SEN2NAIP** (see links below) |
| **Model (pick ONE as primary, mention others as future work)** | - GAN: **Real-ESRGAN / ESRGAN** (fastest to get working, most tutorials exist) <br>- Transformer: **SwinIR / Swin2SR** <br>- Diffusion: **SR3 / latent diffusion** (best quality, hardest/slowest to train in 2 days — only attempt if someone already knows diffusion) |
| **Framework** | PyTorch (most pretrained SR checkpoints are PyTorch) |
| **Training compute** | Google Colab / Kaggle Notebooks (free GPU) — realistic for hackathon timeline |
| **Validation metrics** | PSNR, SSIM, LPIPS (perceptual), Spectral Angle Mapper (SAM), ERGAS (spectral consistency for satellite data specifically) |
| **Backend/serving** | FastAPI (wraps model as an API) |
| **Frontend/demo** | Streamlit (fastest to build) *or* React + Leaflet/Mapbox if someone is confident in frontend, for a "before/after slider" map demo |
| **Versioning/collab** | GitHub (shared repo from tonight) |
| **PPT design** | Canva / PowerPoint / Figma |

> **Reality check for a 2-day sprint:** Don't train a model from scratch. Use a **pretrained SR checkpoint** (Real-ESRGAN has ready weights) and fine-tune briefly on a small patch subset of SEN2VENµS/WorldStrat, OR just run inference with the pretrained model and show validation metrics. A working demo > an ambitious but broken idea.

---

## 3. Team Roles (assuming standard SIH team of 6)

Everyone gets **one core prototype task + one PPT slide set** they own end-to-end — no one is "just doing slides."

| # | Member | Prototype Ownership | PPT Slides Owned |
|---|---|---|---|
| 1 | **Team Lead** | Overall pipeline integration, connects everyone's modules, GitHub repo owner | Title, Problem Statement, Proposed Solution overview |
| 2 | **Data Engineer** | Sentinel-2 data fetch (GEE/Sentinel Hub), cloud masking, tiling/preprocessing script | Data sources & Preprocessing pipeline slide |
| 3 | **ML Engineer 1** | Model selection + inference pipeline (load pretrained Real-ESRGAN/SwinIR, run on sample tiles) | Tech Stack & Model Architecture slide |
| 4 | **ML Engineer 2** | Validation: compute PSNR/SSIM/SAM against high-res reference, uncertainty reporting | Accuracy, Validation & Uncertainty Handling slide |
| 5 | **Prototype/Demo Dev** | Streamlit app: upload/select tile → show before/after + metrics | Prototype/Demo walkthrough slide (they present the live demo) |
| 6 | **Research & Impact Lead** | Literature research, use-case validation (crop/urban/disaster), feasibility & cost | Impact, Use Cases, Innovation/USP, Feasibility slide |

If your team is a different size, just merge/split rows — but keep the rule: **1 person = 1 prototype block + 1 slide set they can explain confidently.**

---

## 4. PPT Structure (standard SIH format, ~10-12 slides)

1. Title / Team / PS details
2. Problem Statement (in your own words)
3. Proposed Solution (one clear diagram: input → preprocessing → model → output → validation)
4. Technical Approach / Architecture diagram
5. Tech Stack
6. Data sources & preprocessing
7. Uniqueness / Innovation (why your model choice, what's novel)
8. Feasibility & Validation approach (metrics used, uncertainty handling)
9. Impact & Use Cases (crop monitoring / urban / disaster response)
10. Prototype screenshots (before/after images + metrics from your demo)
11. Feasibility/challenges & how you'll address them
12. References (papers/datasets you used — see below, shows judges you did real research)

---

## 5. Timeline (Tue night → Thu)

**Tonight (Tue):**
- Finalize tech stack & model choice (this doc)
- Create GitHub repo, assign roles
- Data Engineer: start pulling sample Sentinel-2 tiles
- ML Engineers: download pretrained Real-ESRGAN/SwinIR weights, test run on any sample image
- Everyone: rough draft of your own slide(s)

**Wed (day):**
- Data + Model: get end-to-end pipeline running on 3-5 sample tiles
- Validation metrics computed on at least 1-2 tiles against reference high-res
- Demo Dev: build Streamlit skeleton

**Wed (night):**
- Integrate: pipeline output → demo app
- Polish PPT with real screenshots/numbers (not placeholders)
- Full team run-through/rehearsal

**Thu morning:**
- Final rehearsal, timing check, backup plan if demo fails live (record a video backup!)

---

## 6. Key Public Datasets (no need to collect your own high-res data)

- **WorldStrat** — Sentinel-2 (10m) paired with SPOT 6/7 (1.5m) high-res, global coverage
- **SEN2VENµS** — Sentinel-2 (10/20m) paired with VENµS (5m), 132k+ patches, ready to use
- **SEN2NAIP** — Sentinel-2 paired with US NAIP high-res imagery, good for cross-sensor training
- **ESA OpenSR** — benchmark project with standard datasets/tools for exactly this Sentinel-2 SR task

## 7. Related Work / Research Papers (cite these in your PPT references slide)

- ESRGAN, SwinIR/Swin2MoSE, and diffusion-based approaches adapted specifically for Sentinel-2
- GAN-based Sentinel-2 super-resolution reaching sub-meter output (Res-PGGAN)
- Diffusion model pipelines super-resolving all Sentinel-2 spectral bands (DiffFuSR)
- Curated GitHub list of remote sensing SR papers (good for quick literature review tonight)

(Full links shared below in chat)