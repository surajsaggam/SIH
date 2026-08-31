import torch
import numpy as np


def super_resolve(
    image_tensor,
    model,
    device,
    tile_size=64,
    tile_overlap=16,
    batch_size=16,
    tile=None,
    **kwargs
):
    """
    Performs x4 super-resolution using 64x64 LR tiles matching trained SwinIR architecture.
    Each 64x64 LR tile produces a 256x256 SR tile, stitched seamlessly into a full 4x output.

    Input:
        image_tensor: torch.Tensor, Shape: [3, H, W], Range: [0.0, 1.0]
        model: SwinIR PyTorch model
        device: torch.device
        tile_size: Trained LR patch size (default 64)
        tile_overlap: Overlapping border pixels for tile blending (default 16)
        batch_size: Parallel tile evaluation batch size (default 16)

    Output:
        torch.Tensor, Shape: [3, H*4, W*4], Range: [0.0, 1.0]
    """
    if tile is not None and isinstance(tile, int) and tile > 0:
        tile_size = 64  # Enforce trained 64x64 LR patch size
    model.eval()
    c, h, w = image_tensor.shape
    sf = 4
    b = 1

    # 1. Padding if input dimensions are smaller than trained tile_size
    pad_h = max(0, tile_size - h)
    pad_w = max(0, tile_size - w)
    if pad_h > 0 or pad_w > 0:
        image_tensor = torch.nn.functional.pad(image_tensor, (0, pad_w, 0, pad_h), mode='reflect')
        c, h, w = image_tensor.shape

    # 2. Setup 64x64 LR tiling grid
    stride = tile_size - tile_overlap
    if stride <= 0:
        stride = tile_size // 2

    h_idx_list = sorted(list(set(list(range(0, h - tile_size, stride)) + [h - tile_size])))
    w_idx_list = sorted(list(set(list(range(0, w - tile_size, stride)) + [w - tile_size])))

    img_lq = image_tensor.unsqueeze(0).to(device)
    E = torch.zeros(b, c, h * sf, w * sf, device=device)
    W = torch.zeros_like(E)

    patches = []
    coords = []
    for h_idx in h_idx_list:
        for w_idx in w_idx_list:
            in_patch = img_lq[..., h_idx:h_idx + tile_size, w_idx:w_idx + tile_size]
            patches.append(in_patch.squeeze(0))
            coords.append((h_idx, w_idx))

    # 3. Batched 64x64 tile execution through SwinIR model
    with torch.inference_mode():
        for i in range(0, len(patches), batch_size):
            batch_patches = torch.stack(patches[i:i + batch_size]).to(device)
            batch_outputs = model(batch_patches)

            for j, out_patch in enumerate(batch_outputs):
                h_idx, w_idx = coords[i + j]
                out_patch_mask = torch.ones_like(out_patch)
                E[0, :, h_idx * sf:(h_idx + tile_size) * sf, w_idx * sf:(w_idx + tile_size) * sf].add_(out_patch)
                W[0, :, h_idx * sf:(h_idx + tile_size) * sf, w_idx * sf:(w_idx + tile_size) * sf].add_(out_patch_mask)

    # 4. Overlap accumulation and normalization
    output = E.div_(W).squeeze(0).cpu()

    # Crop padding if padding was added
    if pad_h > 0 or pad_w > 0:
        orig_h = h - pad_h
        orig_w = w - pad_w
        output = output[:, :orig_h * sf, :orig_w * sf]

    output = torch.clamp(output, 0.0, 1.0)
    return output