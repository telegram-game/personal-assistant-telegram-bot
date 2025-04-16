import asyncio
import aiohttp

class HTTPClient:
    def __init__(self, base_url):
        self.base_url = base_url

    async def get(self, endpoint, params=None):
        url = f"{self.base_url}/{endpoint}"
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url) as response:
                    response.raise_for_status()
                    return await self.handle_response(response)
        except aiohttp.ClientError as e:
            print(f"Error: {e}")
            return self.handle_error(e)
        
    async def post(self, endpoint, data=None):
        url = f"{self.base_url}/{endpoint}"
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=data) as response:
                    response.raise_for_status()
                    return await self.handle_response(response)
        except aiohttp.ClientError as e:
            print(f"Error: {e}")
            return self.handle_error(e)
        
    async def handle_response(self, response):
        if response.status == 200:
            response_json = await response.json()
            return response_json["data"]
        else:
            body = await response.text()
            print(f"Error: {response.status} - {body}")
            return None
        
    def handle_error(self, error):
        print(f"Error: {error}")
        return None