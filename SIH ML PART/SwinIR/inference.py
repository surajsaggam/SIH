import torch


def super_resolve(
    image_tensor,
    model,
    device
):
    """
    Performs x4 super-resolution.

    Input:
        image_tensor:
        torch.Tensor
        Shape: [3, H, W]
        Range: [0, 1]

    Output:
        torch.Tensor
        Shape: [3, H*4, W*4]
        Range: [0, 1]
    """

    model.eval()

    # Add batch dimension
    input_tensor = image_tensor.unsqueeze(0).to(device)

    with torch.no_grad():

        output = model(input_tensor)

    # Remove batch dimension
    output = output.squeeze(0).cpu()

    # Clamp valid pixel range
    output = torch.clamp(
        output,
        0.0,
        1.0
    )

    return output