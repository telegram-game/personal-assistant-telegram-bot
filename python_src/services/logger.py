
class Logger: 
    def __init__(self, name: str):
        self.name = name

    def log(self, message: str):
        print(message, flush=True)
