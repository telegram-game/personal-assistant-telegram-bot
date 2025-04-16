from .transform_response import init as init_transform_response_middleware

def init_middlewares(app):
    init_transform_response_middleware(app)