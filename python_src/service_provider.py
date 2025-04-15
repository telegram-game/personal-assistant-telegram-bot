from lib.model_provider import ModelProvider
import torch
import os

class ServiceData:
    def __init__(self):
        self.services = {}

    def get_services(self):
        return self.services
    
    def get_service(self, name):
        if name in self.services:
            return self.services[name]
        else:
            raise ValueError(f"Service {name} not found.")
    
    def add_service(self, name, service):
        self.services[name] = service

class ServiceProvider:
    def __init__(self, cfg):
        self.config = cfg
        self.service_data = ServiceData()

    def init(self):
        config = self.config["model_config"]
        running_config = self.config["device"]
        device = torch.device(running_config if torch.mps.is_available() else "cpu")

        app_name = self.config["app_name"]
        if app_name == "PREDICTION_SERVICE":
            model_version = config["model_version"]

            model_provider = ModelProvider()
            model = model_provider.get_model(model_version, config)
            model.set_device(device)

            model.load(f"{os.getcwd()}/python_src/output/1_test.pth")

            self.service_data.add_service("prediction_service", model)

    def get_service(self, name):
        return self.service_data.get_service(name)
    
    def get_services(self):
        return self.service_data.get_services()