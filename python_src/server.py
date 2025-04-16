from config.config import get_config
from fastapi import FastAPI
from services.service_provider import ServiceProvider
from middlewares.middlewares import init_middlewares
from routers.routers import init_routers
import asyncio
import signal


app = FastAPI()

class Server:
    def __init__(self, app: FastAPI):
        self.app = app

    async def shutdown(self, signal_received, loop):
        self.service_provider.stop()
        await asyncio.sleep(1)
        print("Server shut down complete.")

    def run(self):
        config = get_config()
        self.service_provider = ServiceProvider(config)
        self.service_provider.init()
        init_middlewares(self.app)
        init_routers(self.app, self.service_provider)

server = Server(app)

shutdown_event = asyncio.Event()
signal.signal(signal.SIGTERM, server.shutdown)
signal.signal(signal.SIGINT, server.shutdown)

server.run()
        