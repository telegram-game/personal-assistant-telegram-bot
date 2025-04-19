from models.router import TrainTextModelPayload, TrainTextModelValidationPayload
from threading import Thread
from services.service_provider import ServiceProvider
from build import build_model_with_multiple_data, create_or_load_model
from models.exception import BusinessException

def init_routers(app, service_provider: ServiceProvider):
    # Share variable to indicate if the model is loading
    is_building = False
    config = service_provider.config

    @app.post("/internal/api/v1.0/trainings/text")
    async def _(data: TrainTextModelPayload):
        if is_building:
            raise BusinessException("Model is already building, please try again later")
        
        is_building = True
        def build_model_thread(name: str, from_model_path: str | None, data: str):
            build_model_with_multiple_data(name, from_model_path, data)
            is_building = False
        thread = Thread(target = build_model_thread, args = (data.name, data.from_model_path, data.data))
        thread.start()
        return "Training started successfully"
    
    @app.post("/internal/api/v1.0/trainings/text/validate")
    async def _(data: TrainTextModelValidationPayload):
        text = data.data
        err_str = create_or_load_model(config).validate_train_data(text)
        if err_str is not None:
            raise BusinessException(err_str)
        
        return "Valid data"
