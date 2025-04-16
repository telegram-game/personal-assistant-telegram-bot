from models.router import PredictPayload, LoadModelPayload
from models.exception import BusinessException
from threading import Thread

# Share variable to indicate if the model is loading
global is_loading
global state

def init_routers(app, service_provider):
    state = {
        "is_loading": False
    }

    def is_loadding():
        return state["is_loading"]
    
    def set_is_loading(value: bool):
        state["is_loading"] = value

    @app.post("/internal/api/v1.0/predictions/text")
    async def _(data: PredictPayload):
        if is_loadding():
            raise BusinessException("Model is loading, please try again later")
        
        service = service_provider.get_service("prediction_service")
        result = service.predict(data.prompt, max_new_tokens=100)
        return result
    
    @app.post("/internal/api/v1.0/predictions/text/load")
    async def _(data: LoadModelPayload):
        if is_loadding():
            raise BusinessException("Model is already loading, please try again later")
        
        path = data.path
        set_is_loading(True)
        def load_model(path: str):
            try:
                service = service_provider.get_service("prediction_service")
                service.reload_model(path)
            except Exception as e:
                print(f"Error loading model: {e}")
            finally:
                set_is_loading(False)

        thread = Thread(target = load_model, args = (path, ))
        thread.start()

        return "Model loaded successfully"