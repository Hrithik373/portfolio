# svc-rag

Haystack + FAISS retrieval service.

## Status

| Piece | Status |
|---|---|
| `/health`, `/metrics` | Functional |
| `/status` (index load state) | Functional |
| `/query` dense retrieval (FAISS + self-hosted `bge-small-en-v1.5`) | Functional, once `ingest/index_kb.py` has been run |
| GraphRAG traversal (ArcadeDB) | Not implemented — Phase 3 |
| Cross-encoder reranking | Not implemented — Phase 2 |

## Run locally

```
pip install -r requirements.txt
python ../ingest/index_kb.py         # builds ../data/faiss_index/
FAISS_INDEX_DIR=../data/faiss_index uvicorn app.main:app --reload --port 8011
```

## Dockerfile vs Dockerfile.cloudrun

The plain `Dockerfile` (used by local docker-compose) expects the FAISS
index mounted at runtime from a volume the separate `ingest` one-off job
populates. `Dockerfile.cloudrun` (used by `.github/workflows/ci.yml`'s
`deploy` job) instead bakes the index in at *build* time — copies
`ingest/sources/` and `index_kb.py` into the image and runs the indexing
as a build step — since Cloud Run has no shared volume between two
independently-deployed services. Build context for `Dockerfile.cloudrun`
is `vik/` (not `vik/svc-rag/`), since it needs `ingest/` as a sibling
directory.

## API

- `GET /health` → `{"status": "ok", "service": "svc-rag"}`
- `GET /status` → index load state (whether the FAISS index was found and loaded)
- `POST /query` → `{"query": "...", "top_k": 5}` → ranked chunks with source + score
