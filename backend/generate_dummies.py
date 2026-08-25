import os
import csv
import random
from PIL import Image, ImageDraw, ImageFilter

def generate_satellite_texture(size, base_color, noise_level):
    img = Image.new('RGB', size, base_color)
    pixels = img.load()
    for i in range(size[0]):
        for j in range(size[1]):
            r, g, b = base_color
            noise_r = random.randint(-noise_level, noise_level)
            noise_g = random.randint(-noise_level, noise_level)
            noise_b = random.randint(-noise_level, noise_level)
            pixels[i, j] = (max(0, min(255, r + noise_r)), 
                            max(0, min(255, g + noise_g)), 
                            max(0, min(255, b + noise_b)))
    return img

def draw_grid(img, step, color):
    d = ImageDraw.Draw(img)
    for i in range(0, img.size[0], step):
        d.line([(i, 0), (i, img.size[1])], fill=color)
    for j in range(0, img.size[1], step):
        d.line([(0, j), (img.size[0], j)], fill=color)

def draw_fields(img):
    d = ImageDraw.Draw(img)
    for _ in range(10):
        x1 = random.randint(0, img.size[0]-100)
        y1 = random.randint(0, img.size[1]-100)
        x2 = x1 + random.randint(50, 200)
        y2 = y1 + random.randint(50, 200)
        color = (random.randint(20, 60), random.randint(100, 160), random.randint(20, 60))
        d.rectangle([x1, y1, x2, y2], fill=color, outline=(0,0,0))

def draw_urban(img):
    d = ImageDraw.Draw(img)
    for _ in range(30):
        x1 = random.randint(0, img.size[0]-50)
        y1 = random.randint(0, img.size[1]-50)
        x2 = x1 + random.randint(20, 80)
        y2 = y1 + random.randint(20, 80)
        color = (random.randint(100, 180), random.randint(100, 180), random.randint(100, 180))
        d.rectangle([x1, y1, x2, y2], fill=color)

def draw_disaster(img):
    d = ImageDraw.Draw(img)
    # Flood area
    x1, y1 = random.randint(0, 200), random.randint(0, 200)
    x2, y2 = x1 + random.randint(300, 600), y1 + random.randint(300, 600)
    color = (40, 80, 120)
    d.ellipse([x1, y1, x2, y2], fill=color)

def create_image(filename, scene_type, res_type, size=(800, 800)):
    if scene_type == "crop":
        img = generate_satellite_texture(size, (40, 100, 40), 15)
        draw_fields(img)
    elif scene_type == "urban":
        img = generate_satellite_texture(size, (90, 90, 90), 20)
        draw_urban(img)
    elif scene_type == "disaster":
        img = generate_satellite_texture(size, (80, 100, 80), 20)
        draw_disaster(img)

    # Blur input image to simulate low-res
    if res_type == "input":
        # First downscale, then upscale to simulate blockiness/blur
        small = img.resize((size[0]//4, size[1]//4), Image.Resampling.BILINEAR)
        img = small.resize(size, Image.Resampling.NEAREST)
        img = img.filter(ImageFilter.GaussianBlur(radius=2))
    elif res_type == "ai":
        # Add slight sharpening or artifacts to simulate AI
        img = img.filter(ImageFilter.SHARPEN)
    
    img.save(filename)

public_dir = r"s:\SIH\frontend\public"
os.makedirs(public_dir, exist_ok=True)

samples = [
    {"id": "crop_monitoring", "name": "Crop Monitoring", "type": "crop"},
    {"id": "urban_area", "name": "Urban Area", "type": "urban"},
    {"id": "disaster_assessment", "name": "Disaster Assessment", "type": "disaster"}
]

metrics = []
for idx, sample in enumerate(samples):
    s_id = f"sample_{idx+1}"
    name = sample['name']
    s_type = sample['type']
    
    create_image(os.path.join(public_dir, f"{s_id}_input.png"), s_type, "input", (800, 600))
    create_image(os.path.join(public_dir, f"{s_id}_output.png"), s_type, "ai", (800, 600))
    create_image(os.path.join(public_dir, f"{s_id}_reference.png"), s_type, "ref", (800, 600))
    
    psnr_bicubic = round(26.0 + idx * 1.2, 2)
    ssim_bicubic = round(0.75 + idx * 0.03, 3)
    # Simulate a NaN for the second sample to test robust rendering
    if idx == 1:
        ssim_bicubic = "NaN"

    metrics.append({
        "sample_id": s_id,
        "name": name,
        "psnr_ai": round(30.0 + idx * 1.5, 2),
        "ssim_ai": round(0.85 + idx * 0.04, 3),
        "psnr_bicubic": psnr_bicubic,
        "ssim_bicubic": ssim_bicubic
    })

csv_path = os.path.join(public_dir, "results.csv")
with open(csv_path, 'w', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=["sample_id", "name", "psnr_ai", "ssim_ai", "psnr_bicubic", "ssim_bicubic"])
    writer.writeheader()
    writer.writerows(metrics)

print("Realistic dummy images and results.csv generated.")
