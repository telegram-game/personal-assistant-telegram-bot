from lib.model import IModel
from lib.model_v1 import GPT2Model

class ModelProvider():
    def __init__(self):
        pass

    def get_model(self, model_version, config) -> IModel:
        if model_version == 1:
            return GPT2Model(config)