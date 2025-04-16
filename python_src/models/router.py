from typing import Optional
from pydantic import BaseModel

class PredictPayload(BaseModel):
    prompt: str

class LoadModelPayload(BaseModel):
    path: str

class TrainTextModelPayload(BaseModel):
    data: list[str]
    from_model_path: Optional[str] = None
    name: str