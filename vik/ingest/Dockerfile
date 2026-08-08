# Same Python/Haystack/FAISS dependency stack as svc-rag — see
# svc-rag/requirements.txt for why fastapi/pydantic don't appear here (this
# image doesn't need them) and why transformers/SQLAlchemy/nltk are pinned.
# This image is a one-off job (`docker compose run --rm ingest`), not a
# long-running service — no CMD-as-server, no /health endpoint.
FROM python:3.11-slim

WORKDIR /ingest

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY sources ./sources
COPY index_kb.py .

CMD ["python", "index_kb.py"]
