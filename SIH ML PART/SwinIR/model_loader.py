import torch
from models.network_swinir import SwinIR


def create_swinir_model():
    """
    Creates the exact SwinIR architecture used during fine-tuning.
    """

    model = SwinIR(
        upscale=4,
        in_chans=3,
        img_size=64,
        window_size=8,
        img_range=1.0,
        depths=[6, 6, 6, 6, 6, 6],
        embed_dim=180,
        num_heads=[6, 6, 6, 6, 6, 6],
        mlp_ratio=2,
        upsampler="pixelshuffle",
        resi_connection="1conv"
    )

    return model


def load_swinir_model(
    model_path="deployment_model/swinir_sentinel2_x4.pth",
    device=None
):
    """
    Loads the fine-tuned SwinIR model.
    """
    import os

    if not os.path.isabs(model_path) and not os.path.exists(model_path):
        base_dir = os.path.dirname(os.path.abspath(__file__))
        resolved_path = os.path.join(base_dir, model_path)
        if os.path.exists(resolved_path):
            model_path = resolved_path

    if device is None:
        device = torch.device(
            "cuda" if torch.cuda.is_available() else "cpu"
        )

    model = create_swinir_model()

    checkpoint = torch.load(
        model_path,
        map_location=device
    )

    model.load_state_dict(
        checkpoint["model_state_dict"]
    )

    model = model.to(device)

    model.eval()

    return model, device