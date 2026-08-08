"""Calls svc-rag's /query endpoint to ground svc-agent's answers.

Phase 1: real retrieval, wired into /chat before generation (see main.py) —
the "R" in RAG is no longer a stub. Retrieval failure (svc-rag down/index
not built) degrades gracefully to an empty context list rather than
failing the whole chat turn — the LLM still answers, just unguarded by
retrieved facts, and the system prompt tells it to say so.
"""
from __future__ import annotations

import os

import httpx
from pydantic import BaseModel

SVC_RAG_URL = os.environ.get("SVC_RAG_URL", "http://svc-rag:8011")
TOP_K = int(os.environ.get("RETRIEVAL_TOP_K", "5"))


class ContextChunk(BaseModel):
    content: str
    source: str
    score: float


async def retrieve_context(query: str) -> list[ContextChunk]:
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{SVC_RAG_URL}/query", json={"query": query, "top_k": TOP_K}
            )
            response.raise_for_status()
            body = response.json()
    except (httpx.HTTPError, ValueError):
        return []

    if not body.get("index_available"):
        return []
    return [ContextChunk(**chunk) for chunk in body.get("chunks", [])]
