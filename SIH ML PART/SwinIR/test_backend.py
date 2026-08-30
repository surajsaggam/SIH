import torch

from model_loader import load_swinir_model
from inference import super_resolve


# Load model
model, device = load_swinir_model()

print("Device:", device)
print("Model loaded successfully!")


# Create a dummy Sentinel-2 RGB patch
dummy_input = torch.rand(
    3,
    64,
    64
)


# Run super-resolution
output = super_resolve(
    dummy_input,
    model,
    device
)


print("Input shape:", dummy_input.shape)
print("Output shape:", output.shape)