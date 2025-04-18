from config.config import get_config
from fastapi import FastAPI
from services.service_provider import ServiceProvider
from middlewares.middlewares import init_middlewares
from routers.routers import init_routers
from unsync import unsync

app = FastAPI()

class Server:
    def __init__(self, app: FastAPI):
        self.app = app

    @unsync
    async def shutdown(self, signum, frame):
        self.service_provider.stop()
        print("Server shut down complete.")

    @unsync
    async def run(self):
        config = get_config()
        self.service_provider = ServiceProvider(config)
        await self.service_provider.init()
        init_middlewares(self.app)
        init_routers(self.app, self.service_provider)

server = Server(app)

# signal.signal(signal.SIGTERM, server.shutdown)
# signal.signal(signal.SIGINT, server.shutdown)

server.run().result()
        