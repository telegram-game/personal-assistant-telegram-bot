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
            "context_length": 64,
            "drop_rate": 0.1,
            "n_layers": 12,
            "n_heads": 12,
            "qkv_bias": False,
            "stride": 8,
        }
    
def get_config():
    return {
        "host": "localhost",
        "port": 8000,
        "device": "mps",
        "model_config": get_model_config(),
        "data_service_url": os.getenv("DATA_SERVICE_URL", "http://localhost:4002"),
        "app_name": os.getenv("APP_NAME", "PREDICTION_SERVICE"),
    }