import torch
from data_util import load_example_data
from config import get_model_config
from lib.model_provider import ModelProvider
from data_util import save_model

def build_model(name, from_model_path, data):
    device = torch.device("cuda" if torch.mps.is_available() else "cpu")

    config = get_model_config()
    model_version = config["model_version"]

    model_provider = ModelProvider()
    model = model_provider.get_model(model_version, config)
    model.set_device(device)
    
    if from_model_path:
        model.load(from_model_path)

    model.start_train(data)
    save_model(model, f"{model_version}_{name}.pth")


def main():
    train_data = load_example_data()
    build_model("test", None, train_data)


if __name__ == '__main__':
    main()