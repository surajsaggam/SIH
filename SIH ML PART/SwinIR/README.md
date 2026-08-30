# Sentinel-2 Image Super-Resolution using Fine-Tuned SwinIR

## Project Overview

This project fine-tunes a pretrained SwinIR Transformer model for
4× super-resolution of Sentinel-2 satellite imagery.

The model takes a low-resolution Sentinel-2 RGB image patch of size
64 × 64 and generates a super-resolved image of size 256 × 256.

---

## Model Pipeline

Sentinel-2 Low Resolution Image

        ↓

Fine-Tuned SwinIR Transformer

        ↓

4× Super Resolution

        ↓

High Resolution Reconstruction

---

## Model Architecture

- Model: SwinIR
- Task: Classical Image Super-Resolution
- Scale factor: 4×
- Input channels: 3
- Input size: 64 × 64
- Output size: 256 × 256
- Window size: 8
- Embedding dimension: 180
- Number of Swin Transformer layers: 6
- Upsampler: PixelShuffle

---

## Dataset

The model was fine-tuned using paired Sentinel-2 low-resolution
imagery and NAIP high-resolution reference imagery.

The model was evaluated on a held-out test dataset.

---

## Results

| Method | PSNR | SSIM | RMSE |
|---|---:|---:|---:|
| Bicubic Interpolation | 31.6081 | 0.7861 | 0.03069 |
| Fine-Tuned SwinIR | 33.5121 | 0.8555 | 0.02445 |

### Improvement

- PSNR improvement: approximately +1.90 dB
- SSIM improvement: approximately +0.069
- RMSE reduction: approximately 20%

These results indicate that the fine-tuned SwinIR model produces
reconstructions that are closer to the available high-resolution
NAIP reference than bicubic interpolation on the held-out test set.

---

## Installation

Install the required dependencies:

```bash
pip install -r requirements.txt