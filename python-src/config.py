model_version = 1

def get_model_config(): 
    if model_version == 1:
        return {
            "model_version": model_version,
            "dataset_version": 2,
            "vocab_size": 50257,
            "emb_dim": 100,
            "hidden_dim": 200,
            "context_length": 1024,
            "drop_rate": 0.1,
            "n_layers": 12,
            "n_heads": 12,
            "qkv_bias": True,
            "stride": 512,
            "max_length": 1024,
            "batch_size": 4,
            "num_epochs": 1,
            "learning_rate": 0.001,
            "weight_decay": 0.01,
            "warmup_steps": 4000,
            "adam_epsilon": 1e-8,
            "gradient_accumulation_steps": 1,
            "gradient_checkpointing": False,
        }