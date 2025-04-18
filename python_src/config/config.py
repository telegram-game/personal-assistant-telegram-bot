import os

model_version = 1

def get_model_config(): 
    if model_version == 1:
        return {
            "model_version": model_version,
            "dataset_version": 2,
            "vocab_size": 50257,
            "emb_dim": 768,
            "hidden_dim": 200,
            "context_length": 256,
            "drop_rate": 0.1,
            "n_layers": 12,
            "n_heads": 12,
            "qkv_bias": False,
            "stride": 32,
        }
    
def get_config():
    return {
        "app_name": os.getenv("APP_NAME", "PREDICTION_SERVICE"),
        "device": "mps",
        "model_config": get_model_config(),
        "data_service_url": os.getenv("DATA_SERVICE_URL", "http://localhost:4002"),
        "redis_host": os.getenv("REDIS_HOST", "localhost"),
        "redis_port": os.getenv("REDIS_PORT", 63791),
        "redis_user": os.getenv("REDIS_USER", None),
        "redis_password": os.getenv("REDIS_PASSWORD", None),
        "queue_prefix": "{prefix}:queues",
        "build_model_queue_name": "build-model-queue",
        "predict_message_queue_name": "predict-message-queue",
    }