from ctypes import Array
from config import get_config
from fastapi import FastAPI, Request
from service_provider import ServiceProvider
from pydantic import BaseModel
import time
from starlette.responses import Response
import json
from build import build_model_with_multiple_data, build_model
from threading import Thread
from typing import Optional


class PredictModel(BaseModel):
    prompt: str

class LoadModel(BaseModel):
    path: str

class TrainTextModel(BaseModel):
    data: list[str]
    from_model_path: Optional[str] = None
    name: str

class BusinessException(Exception):
    def __init__(self, message):
        self.message = message

    def __str__(self):
        return self.message

app = FastAPI()
config = get_config()
service_provider = ServiceProvider(config)
service_provider.init()

is_loading = True

@app.middleware("http")
async def response_transformer_middleware(request: Request, call_next):
    start_time = time.perf_counter()
    try:
        response = await call_next(request)
        response.headers["Content-Type"] = "application/json"

        if response.status_code != 200:
            return response
        
        process_time = time.perf_counter() - start_time

        data = b""
        async for chunk in response.body_iterator:
            data += chunk
        data_str = data.decode("utf-8")
        response_json = {
            "data": json.loads(data_str),
            "responseTime": str(process_time),
            "timestamp": start_time,
        }
        modified_response = json.dumps(response_json).encode("utf-8")
        response.headers['Content-Length'] = str(len(modified_response))
        return Response(content=json.dumps(response_json).encode("utf-8"), status_code=response.status_code,
                headers=dict(response.headers), media_type=response.media_type)
    except BusinessException as e:
        print(f"Business exception: {e}")
        return Response(content=json.dumps({"errorMessage": str(e)}).encode("utf-8"), status_code=500, media_type="application/json")
    except Exception as e:
        print(f"Error reading request body: {e}")
        return Response(content=json.dumps({"errorMessage": "Internal Server Error"}).encode("utf-8"), status_code=500, media_type="application/json")

@app.get("/health")
async def health_check():
    print("Health check endpoint called")
    return {"status": "healthy"}

app_name = config["app_name"]
if app_name == "PREDICTION_SERVICE":

    @app.post("/internal/api/v1.0/predictions/text")
    async def predict_text(data: PredictModel):
        if is_loading:
            raise BusinessException("Model is loading, please try again later")
        
        service = service_provider.get_service("prediction_service")

        result = service.predict(data.prompt, max_new_tokens=100)
        return result
    
    @app.post("/internal/api/v1.0/predictions/text/load")
    async def load_model(data: LoadModel):
        path = data.path
        is_loading = True
        service = service_provider.get_service("prediction_service")
        service.load(path)
        is_loading = False
        return "Model loaded successfully"
elif app_name == "TRAIN_SERVICE":
    @app.post("/internal/api/v1.0/trainings/text")
    async def train_text(data: TrainTextModel):
        # thread = Thread(target = build_model_with_multiple_data, args = (data.name, data.from_model_path, data.data))
        # thread.start()
        build_model(data.name, data.from_model_path, data.data[0])
        return "Training started successfully"

        