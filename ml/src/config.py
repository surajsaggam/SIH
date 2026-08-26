"""
ML Configuration Module
Responsibility: Defines hyperparameters, dataset paths, training settings,
model architecture configurations, scale factors, and hardware device settings.
"""

from dataclasses import dataclass
from pathlib import Path


@dataclass
class MLConfig:
    # Model architecture parameters
    scale_factor: int = 4
    num_channels: int = 3
    num_features: int = 64
    num_blocks: int = 16

    # Training hyperparameters
    batch_size: int = 16
    learning_rate: float = 1e-4
    num_epochs: int = 100
    patch_size: int = 128

    # Paths
    raw_data_dir: Path = Path(__file__).resolve().parent.parent / "data" / "raw"
    processed_data_dir: Path = Path(__file__).resolve().parent.parent / "data" / "processed"
    weights_dir: Path = Path(__file__).resolve().parent.parent / "weights"

    # Hardware
    device: str = "cuda"  # "cuda", "cpu", or "mps"


config = MLConfig()
