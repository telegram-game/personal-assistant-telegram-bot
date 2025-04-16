from models.router import TrainTextModelPayload
from threading import Thread
from services.service_provider import ServiceProvider
from build import build_model_with_multiple_data
from models.exception import BusinessException

def init_routers(app, service_provider: ServiceProvider):
    # Share variable to indicate if the model is loading
    is_building = False

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