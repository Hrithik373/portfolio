"""Indexes vik/ingest/sources/**/*.md into a FAISS-backed Haystack document store.

Run with:  python index_kb.py
Produces:  $FAISS_INDEX_DIR/faiss_document_store.db
           $FAISS_INDEX_DIR/faiss_index.faiss
           $FAISS_INDEX_DIR/faiss_index.json

svc-rag loads the same index read-only at query time (see svc-rag/app/retrieve.py).
Embeddings are self-hosted (bge-small-en-v1.5) so re-indexing costs $0 in API calls.

IMPORTANT: FAISSDocumentStore bakes the *absolute path* of its SQLite side-store
into the saved config (faiss_index.json) — there's no override at load time
(see FAISSDocumentStore.load()'s signature). So this must be run from whatever
absolute path context will also be used to load it later. FAISS_INDEX_DIR
defaults to a path relative to this script for convenience when running
directly on the host, but the portable way to run this is via
`docker compose run --rm ingest` (see infra/docker-compose.yml), which mounts
the same /data/faiss_index path this script writes to as the path svc-rag's
container reads from — guaranteeing they match.
"""
from __future__ import annotations

import os
from pathlib import Path

from haystack.document_stores import FAISSDocumentStore
from haystack.nodes import EmbeddingRetriever, PreProcessor
from haystack.schema import Document

SOURCES_DIR = Path(__file__).parent / "sources"
INDEX_DIR = Path(os.environ.get("FAISS_INDEX_DIR", Path(__file__).parent.parent / "data" / "faiss_index"))
EMBEDDING_MODEL = "BAAI/bge-small-en-v1.5"


def load_markdown_documents() -> list[Document]:
    docs = []
    for path in sorted(SOURCES_DIR.rglob("*.md")):
        text = path.read_text(encoding="utf-8")
        relative = path.relative_to(SOURCES_DIR).as_posix()
        docs.append(
            Document(
                content=text,
                meta={
                    "source": relative,
                    "kind": "project" if "projects/" in relative else
                             "github" if "github/" in relative else
                             relative.replace(".md", ""),
                },
            )
        )
    return docs


def build_index() -> None:
    INDEX_DIR.mkdir(parents=True, exist_ok=True)
    db_path = INDEX_DIR / "faiss_document_store.db"

    # Fresh build every run: index_kb.py is meant to be re-run whenever
    # ingest/sources/ changes, not incrementally patched.
    for suffix in ("faiss_document_store.db", "faiss_index.faiss", "faiss_index.json"):
        stale = INDEX_DIR / suffix
        if stale.exists():
            stale.unlink()

    document_store = FAISSDocumentStore(
        sql_url=f"sqlite:///{db_path}",
        faiss_index_factory_str="Flat",
        embedding_dim=384,  # bge-small-en-v1.5 output dim
        similarity="cosine",
    )

    raw_docs = load_markdown_documents()
    if not raw_docs:
        raise SystemExit(f"No markdown sources found under {SOURCES_DIR}")

    preprocessor = PreProcessor(
        clean_empty_lines=True,
        clean_whitespace=True,
        split_by="word",
        split_length=200,
        split_overlap=30,
        split_respect_sentence_boundary=True,
    )
    chunks = preprocessor.process(raw_docs)

    document_store.write_documents(chunks)

    retriever = EmbeddingRetriever(
        document_store=document_store,
        embedding_model=EMBEDDING_MODEL,
        model_format="sentence_transformers",
    )
    document_store.update_embeddings(retriever)
    document_store.save(index_path=str(INDEX_DIR / "faiss_index.faiss"))

    print(
        f"Indexed {len(raw_docs)} source files -> {len(chunks)} chunks "
        f"into {INDEX_DIR}"
    )


if __name__ == "__main__":
    build_index()
