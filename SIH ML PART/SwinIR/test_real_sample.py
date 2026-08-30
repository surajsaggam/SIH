import os
import torch

from model_loader import load_swinir_model
from inference import super_resolve


# -------------------------
# 1. Load the trained model
# -------------------------

model, device = load_swinir_model()

print("Device:", device)
print("Model loaded successfully!")


# -------------------------
# 2. Locate cached test data
# -------------------------

TEST_LR_DIR = os.path.join(
    "dataset_cache",
    "test",
    "lr"
)

print("\nLooking for test samples in:")
print(TEST_LR_DIR)


# Get cached .pt files
files = [
    f for f in os.listdir(TEST_LR_DIR)
    if f.endswith(".pt")
]

print("Number of test samples:", len(files))


# -------------------------
# 3. Load one real sample
# -------------------------

sample_path = os.path.join(
    TEST_LR_DIR,
    files[0]
)

lr_image = torch.load(
    sample_path,
    map_location="cpu"
)

print("\nLoaded sample:")
print("Shape:", lr_image.shape)
print("Min:", lr_image.min().item())
print("Max:", lr_image.max().item())


# -------------------------
# 4. Run inference
# -------------------------

sr_output = super_resolve(
    lr_image,
    model,
    device
)

print("\nSuper-resolution complete!")
print("Input shape:", lr_image.shape)
print("Output shape:", sr_output.shape)
print("Output min:", sr_output.min().item())
print("Output max:", sr_output.max().item())