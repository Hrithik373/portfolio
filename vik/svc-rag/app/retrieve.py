"""Hybrid retrieval over the KB index built by ingest/index_kb.py.

Phase 0 (this file): dense retrieval via the FAISS store is real and working
once the index exists. GraphRAG traversal against ArcadeDB and cross-encoder
reranking are wired as clearly-marked TODOs for Phase 3 (see architecture
doc §5, §10) rather than faked here.
"""
from __future__ import annotations

import os
from pathlib import Path
from typing import Optional

from pydantic import BaseModel

INDEX_DIR = Path(os.environ.get("FAISS_INDEX_DIR", "/data/faiss_index"))
EMBEDDING_MODEL = os.environ.get("EMBEDDING_MODEL", "BAAI/bge-small-en-v1.5")


class RetrievedChunk(BaseModel):
    content: str
    source: str
    score: float


class QueryRequest(BaseModel):
    query: str
    top_k: int = 5


class QueryResponse(BaseModel):
    chunks: list[RetrievedChunk]
    index_available: bool


class Retriever:
    """Lazily loads the FAISS document store + embedding retriever.

    Deferred import/load so the service starts (and /health responds) even
    before the KB has been indexed or heavy ML deps have finished installing.
    """

    def __init__(self) -> None:
        self._retriever = None
        self._load_error: Optional[str] = None

    def _ensure_loaded(self):
        if self._retriever is not None or self._load_error is not None:
            return
        try:
            from haystack.document_stores import FAISSDocumentStore
            from haystack.nodes import EmbeddingRetriever

            db_path = INDEX_DIR / "faiss_document_store.db"
            index_path = INDEX_DIR / "faiss_index.faiss"
            if not (db_path.exists() and index_path.exists()):
                raise FileNotFoundError(
                    f"No FAISS index at {INDEX_DIR} — run ingest/index_kb.py first"
                )
            document_store = FAISSDocumentStore.load(
                index_path=str(index_path),
                config_path=str(INDEX_DIR / "faiss_index.json"),
            )
            self._retriever = EmbeddingRetriever(
                document_store=document_store,
                embedding_model=EMBEDDING_MODEL,
                model_format="sentence_transformers",
            )
        except Exception as exc:  # noqa: BLE001 - surfaced via /health and /query
            self._load_error = str(exc)

    def query(self, text: str, top_k: int) -> QueryResponse:
        self._ensure_loaded()
        if self._retriever is None:
            return QueryResponse(chunks=[], index_available=False)

        results = self._retriever.retrieve(query=text, top_k=top_k)
        chunks = [
            RetrievedChunk(
                content=doc.content,
                source=doc.meta.get("source", "unknown"),
                score=doc.score or 0.0,
            )
            for doc in results
        ]
        return QueryResponse(chunks=chunks, index_available=True)

    @property
    def status(self) -> dict:
        self._ensure_loaded()
        return {
            "index_dir": str(INDEX_DIR),
            "loaded": self._retriever is not None,
            "error": self._load_error,
        }


retriever = Retriever()
