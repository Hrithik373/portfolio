"""Shared health/metrics wiring, duplicated per-service on purpose.

Each Vik service builds from its own isolated Docker context (see each
service's Dockerfile), so a shared pip package would mean copying source
across build contexts anyway. Keeping this ~30-line file duplicated per
service is simpler than introducing a shared internal package for six
independently-deployable microservices.
"""
import time

from fastapi import FastAPI, Request
from prometheus_client import Counter, Histogram, make_asgi_app

SERVICE_NAME = "svc-translate"

REQUEST_COUNT = Counter(
    "vik_requests_total", "Total requests", ["service", "path", "status"]
)
REQUEST_LATENCY = Histogram(
    "vik_request_latency_seconds", "Request latency", ["service", "path"]
)


def instrument(app: FastAPI) -> None:
    app.mount("/metrics", make_asgi_app())

    @app.middleware("http")
    async def _metrics_middleware(request: Request, call_next):
        start = time.perf_counter()
        response = await call_next(request)
        REQUEST_LATENCY.labels(SERVICE_NAME, request.url.path).observe(
            time.perf_counter() - start
        )
        REQUEST_COUNT.labels(
            SERVICE_NAME, request.url.path, response.status_code
        ).inc()
        return response

    @app.get("/health")
    async def health():
        return {"status": "ok", "service": SERVICE_NAME}
