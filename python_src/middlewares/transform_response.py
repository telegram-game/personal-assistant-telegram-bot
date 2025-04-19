from fastapi import Request
from starlette.responses import Response
from models.exception import BusinessException
import time
import json

def init(app):
    @app.middleware("http")
    async def _(request: Request, call_next):
        start_time = time.perf_counter()
        try:
            response = await call_next(request)
            response.headers["Content-Type"] = "application/json"

            if response.status_code != 200:
                return response

            process_time = time.perf_counter() - start_time

            data = b""
            async for chunk in response.body_iterator:
                data += chunk
            data_str = data.decode("utf-8")
            response_json = {
                "data": json.loads(data_str),
                "responseTime": str(process_time),
                "timestamp": start_time,
            }
            modified_response = json.dumps(response_json).encode("utf-8")
            response.headers['Content-Length'] = str(len(modified_response))
            return Response(content=json.dumps(response_json).encode("utf-8"), status_code=response.status_code,
                    headers=dict(response.headers), media_type=response.media_type)
        except BusinessException as e:
            print(f"Business exception: {e}")
            return Response(content=json.dumps({"detail": str(e)}).encode("utf-8"), status_code=500, media_type="application/json")
        except Exception as e:
            print(f"Error reading request body: {e}")
            return Response(content=json.dumps({"detail": "Internal Server Error"}).encode("utf-8"), status_code=500, media_type="application/json")
