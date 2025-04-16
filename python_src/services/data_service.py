from lib.http import HTTPClient

class DataService:
    def __init__(self, config):
        url = config["data_service_url"]
        self.client = HTTPClient(url)

    async def get_current_model(self):
        return await self.client.get("internal/api/v1.0/models/current")
    
    async def get_train_data(self, ai_model_id: int, limit: int = 10):
        return await self.client.get(f"internal/api/v1.0/train-data/for-train?aiModelId={ai_model_id}&limit={limit}")
    
    async def update_complete_train_data(self, ai_model_id: int, train_data_ids: list[int]):
        return await self.client.post("internal/api/v1.0/train-data/for-train", {
            "aiModelId": ai_model_id,
            "trainDataIds": train_data_ids
        })
    
    async def update_processing_train_data(self, ai_model_id: int):
        return await self.client.post("internal/api/v1.0/train-data/processing/for-train", {
            "aiModelId": ai_model_id,
        })
    
    async def update_complete_ai_model(self, ai_model_id: int, path: str):
        return await self.client.post("internal/api/v1.0/models/complete", {
            "aiModelId": ai_model_id,
            "path": path
        })