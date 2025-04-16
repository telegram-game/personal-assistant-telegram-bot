from lib.http import HTTPClient

class DataService:
    def __init__(self, config):
        url = config["data_service_url"]
        self.client = HTTPClient(url)

    def get_current_model(self):
        return self.client.get("/internal/api/v1.0/models/current")