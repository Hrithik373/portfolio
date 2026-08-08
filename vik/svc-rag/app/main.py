from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.observability import instrument
from app.retrieve import QueryRequest, QueryResponse, retriever

WIDGET_ORIGIN = "http://localhost:5173"

app = FastAPI(title="vik-svc-rag")
instrument(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[WIDGET_ORIGIN],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


@app.get("/status")
async def status():
    """Index-load status, separate from /health so orchestrators don't flap
    the service just because the KB hasn't been indexed yet."""
    return retriever.status


@app.post("/query", response_model=QueryResponse)
async def query(request: QueryRequest) -> QueryResponse:
    return retriever.query(request.query, request.top_k)
