"""
ML Service Client / Inference Adapter
Responsibility: Bridges backend API requests with the ML model pipeline,
handling pre-processing, model invocation (in-memory or remote), and post-processing.
"""


class MLServiceClient:
    """
    Placeholder client interface to interact with ML models and weights.
    """

    def __init__(self, weights_path: str | None = None):
        self.weights_path = weights_path
        self.model = None

    def load_model(self):
        """Placeholder for loading model checkpoints into memory/device."""
        pass

    def predict(self, input_image):
        """Placeholder for running inference on input imagery."""
        raise NotImplementedError("ML inference logic not yet implemented.")
