
def init_routers(app, service_provider):

    @app.get("/health")
    async def health_check():
        print("Health check endpoint called")
        return {"status": "healthy"}

    @app.post("/internal/api/v1.0/predictions/text")
    async def predict_text(request):
        data = await request.json()
        prompt = data.get("prompt")
        if not prompt:
            return {"error": "Prompt is required"}
        
        service = service_provider.get_service("prediction_service")
        
        result = service.predict(prompt)
        return {"result": result}