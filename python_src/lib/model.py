from abc import abstractmethod
from torch import nn
import torch

class IModel(nn.Module): 
    def __init__(self):
        super(IModel, self).__init__()
        self.device = None
        self.is_loaded = False
        self.can_load = True
        
    def load(self, path):
        if not path:
            raise ValueError("Model path is required")
        if self.device is None:
            raise ValueError("Device is not set")
        if self.is_loaded:
            raise ValueError("Model is already loaded")
        if not self.can_load:
            raise ValueError("Model cannot be loaded from the specified path")
        self.load_state_dict(torch.load(path, map_location=self.device))
        self.eval()
        self.is_loaded = True

    def reload_model(self, path: str):
        if not self.is_loaded:
            raise ValueError("Model is not loaded please use load method")
        if not path:
            raise ValueError("Model path is required")
        if self.device is None:
            raise ValueError("Device is not set")
        if not self.can_load:
            raise ValueError("Model cannot be loaded from the specified path")
        self.load_state_dict(torch.load(path, map_location=self.device))
        self.eval()

    @abstractmethod
    def start_train(self, data):
        pass

    @abstractmethod
    def start_eval(self, data):
        pass

    @abstractmethod
    def encode(self, data):
        pass

    @abstractmethod
    def decode(self, path):
        pass

    @abstractmethod
    def predict(self, data):
        pass

    def set_device(self, device):
        self.to(device)
        self.device = device
        if device == "mps":
            self.to(torch.float32)