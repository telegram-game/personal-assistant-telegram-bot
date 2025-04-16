import torch
from data_util import load_data
from lib.model_provider import ModelProvider
from config.config import get_model_config

def evaluate_model(from_model_path, test_data):
    device = torch.device("cuda" if torch.mps.is_available() else "cpu")

    config = get_model_config()
    model_version = config["model_version"]

    model_provider = ModelProvider()
    model = model_provider.get_model(model_version, config)
    model.set_device(device)
    model.load(from_model_path)

    model.start_eval(test_data)

def main():
    _, test_data = load_data()
    from_model_path = "model_v1_v1.pth"  # Example model path
    evaluate_model(from_model_path, test_data)
    print("Evaluation completed.")
    


if __name__ == '__main__':
    main()