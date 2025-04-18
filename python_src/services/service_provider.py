from lib.model_provider import ModelProvider
from services.data_service import DataService
from services.job import BuildModelJob, PredictMessageJob
import torch
import os

class ServiceData:
    def __init__(self):
        self.services = {}

    def get_services(self):
        return self.services
    
    def get_service(self, name: str):
        if name in self.services:
            return self.services[name]
        else:
            raise ValueError(f"Service {name} not found.")
    
    def add_service[T](self, name, service):
        self.services[name] = service

class ServiceProvider:
    def __init__(self, cfg):
        self.config = cfg
        self.service_data = ServiceData()

    async def init(self):
        config = self.config["model_config"]
        running_config = self.config["device"]
        device = torch.device(running_config if torch.mps.is_available() else "cpu")

        # Initialize data service
        data_service = DataService(self.config)
        self.service_data.add_service("data_service", data_service)

        app_name = self.config["app_name"]
        if app_name == "PREDICTION_SERVICE":
            model_version = config["model_version"]

            model_provider = ModelProvider()
            model = model_provider.get_model(model_version, config)
            model.set_device(device)

            current_model = await data_service.get_current_model()
            print(f"Current model: {current_model}")
            if current_model is not None:
                output_dir = self.config["output_dir"]
                model_path = f"{os.getcwd()}/{output_dir}{current_model["path"]}"
                print(f"Loading model from path: {model_path}")     
                model.load(model_path)

            self.service_data.add_service("prediction_service", model)

            predict_message_job = PredictMessageJob(self)
            predict_message_job.start()
            self.service_data.add_service("predict_message_job", predict_message_job)
        elif app_name == "TRAIN_SERVICE":
            build_model_job = BuildModelJob(self)
            build_model_job.start()
            self.service_data.add_service("build_model_job", build_model_job)

    def stop(self):
        app_name = self.config["app_name"]
        if app_name == "PREDICTION_SERVICE":
            predict_message_job = self.service_data.get_service("predict_message_job")
            predict_message_job.stop()
        elif app_name == "TRAIN_SERVICE":
            build_model_job = self.service_data.get_service("build_model_job")
            build_model_job.stop()

    def get_service(self, name):
        return self.service_data.get_service(name)
    
    def get_services(self):
        return self.service_data.get_services()