import requests

class HTTPClient:
    def __init__(self, base_url):
        self.base_url = base_url

    def get(self, endpoint, params=None):
        url = f"{self.base_url}/{endpoint}"
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            return self.handle_response(response)
        except requests.exceptions.RequestException as e:
            print(f"Error: {e}")
            return None
        
    def post(self, endpoint, data=None):
        url = f"{self.base_url}/{endpoint}"
        try:
            response = requests.post(url, json=data)
            response.raise_for_status()
            return self.handle_response(response)
        except requests.exceptions.RequestException as e:
            print(f"Error: {e}")
            return self.handle_error(e)
        
    def handle_response(self, response):
        if response.status_code == 200:
            response_json = response.json()
            return response_json["data"]
        else:
            print(f"Error: {response.status_code} - {response.text}")
            return None
        
    def handle_error(self, error):
        print(f"Error: {error}")
        return None