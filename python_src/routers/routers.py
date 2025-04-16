from .prediction_service_routers import init_routers as init_prediction_service_routers
from .train_service_routers import init_routers as init_train_service_routers


def init_routers(app, service_provider):
    @app.get("/health")
    async def _():
        print("Health check endpoint called")
        return {"status": "healthy"}

    app_name = service_provider.config["app_name"]
    if app_name == "PREDICTION_SERVICE":
        init_prediction_service_routers(app, service_provider)
    elif app_name == "TRAIN_SERVICE":
        init_train_service_routers(app, service_provider)