from bullmq import Worker, Job
from build import create_or_load_model
import os
import torch

class BuildModelJob:
    def __init__(self, service_provider):
        config = service_provider.config
        self.config = config
        self.service_provider = service_provider

    async def process(self, job: Job, job_token: str):
        # job.data will include the data added to the queue
        print("Processing job with data:", job.data, job_token)
        try:
            data_service = self.service_provider.service_data.get_service("data_service")
            ai_model_id = job.data["id"]
            data_file_path = job.data["dataFilePath"]
            from_model_path: str | None = None
            if "fromModelPath" in job.data:
                from_model_path = job.data["fromModelPath"]

            # Ensure every data is ready to be trained
            await data_service.update_processing_train_data(ai_model_id)

            model = create_or_load_model(self.config, from_model_path)

            # Load the data
            train_data: list = await data_service.get_train_data(ai_model_id, 10)
            while len(train_data) > 0:
                train_data_texts = [item["data"] for item in train_data]
                for text in train_data_texts:
                    model.start_train(text, num_epochs=10)

                # Process the train data
                train_data_ids = [item["id"] for item in train_data]
                await data_service.update_complete_train_data(ai_model_id, train_data_ids)
                # Get the next batch of train data
                train_data = await data_service.get_train_data(ai_model_id, 10)

            # Save the model
            if not os.path.exists("output"):
                os.makedirs("output")
            torch.save(model.state_dict(), data_file_path)

            # Update the model as complete
            await data_service.update_complete_ai_model(ai_model_id, data_file_path)
        except Exception as e:
            print(f"Error processing job: {e}")
            # Handle the error (e.g., retry, log, etc.)
            raise e

    def start(self):
        # This method should be implemented to start the job
        queue_name = self.config["build_model_queue_name"]
        queue_prefix = self.config["queue_prefix"]
        self.worker = Worker(queue_name, self.process, {"connection": self.get_redis_connection_str(), "prefix": queue_prefix})
        pass

    def stop(self):
        # This method should be implemented to stop the job
        self.worker.close()

    def get_redis_connection_str(self):
        redis_user = self.config["redis_user"]
        redis_password = self.config["redis_password"]
        if redis_user is None or redis_password is None:
            print(f"redis://{self.config['redis_host']}:{self.config['redis_port']}")
            return f"redis://{self.config['redis_host']}:{self.config['redis_port']}"
        print(f"rediss://{self.config['redis_user']}:{self.config['redis_password']}@{self.config['redis_host']}:{self.config['redis_port']}")
        return f"rediss://{self.config['redis_user']}:{self.config['redis_password']}@{self.config['redis_host']}:{self.config['redis_port']}"