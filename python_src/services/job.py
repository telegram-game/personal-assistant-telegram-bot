from bullmq import Worker, Job

class BuildModelJob:
    def __init__(self, service_provider):
        config = service_provider.config
        self.config = config

    async def process(self, job: Job, job_token: str):
        # job.data will include the data added to the queue
        print("Processing job with data:", job.data, job_token)
        pass

    def start(self):
        # This method should be implemented to start the job
        queue_name = self.config["build_model_queue_name"]
        self.worker = Worker(queue_name, self.process, {"connection": self.get_redis_connection_str()})
        pass

    def stop(self):
        # This method should be implemented to stop the job
        self.worker.close()

    def get_redis_connection_str(self):
        return f"rediss://{self.config['redis_user']}:{self.config['redis_password']}@{self.config['redis_host']}:{self.config['redis_port']}"