import torch
from data_util import load_example_data
from config.config import get_model_config, get_config
from lib.model_provider import ModelProvider
from data_util import save_model

def create_or_load_model(config, from_model_path: str | None = None):
    device = torch.device(config["device"] if torch.mps.is_available() else "cpu")
    model_config = config["model_config"]
    model_version = model_config["model_version"]
    model_provider = ModelProvider()
    model = model_provider.get_model(model_version, model_config)
    model.set_device(device)

    if from_model_path:
        model.load(from_model_path)
    return model

def build_model_with_multiple_data(name: str, from_model_path: str | None, data: list[str]):
    running_config = get_config()

    device = torch.device(running_config["device"] if torch.mps.is_available() else "cpu")

    config = get_model_config()
    model_version = config["model_version"]

    model_provider = ModelProvider()
    model = model_provider.get_model(model_version, config)
    model.set_device(device)
    
    if from_model_path:
        model.load(from_model_path)

    for data_item in data:
        model.start_train(data_item, num_epochs=10)
    save_model(model, f"{model_version}_{name}.pth")

def build_model(name: str, from_model_path: str | None, data: str):
    running_config = get_config()

    device = torch.device(running_config["device"] if torch.mps.is_available() else "cpu")

    config = get_model_config()
    model_version = config["model_version"]

    model_provider = ModelProvider()
    model = model_provider.get_model(model_version, config)
    model.set_device(device)
    
    if from_model_path:
        model.load(from_model_path)

    model.start_train(data, num_epochs=10)
    save_model(model, f"{model_version}_{name}.pth")


def main():
    train_data = load_example_data()
    build_model("test", None, train_data)


if __name__ == '__main__':
    main()