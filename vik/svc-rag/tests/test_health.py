from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "svc-rag"}


def test_status_reports_index_state():
    # No index is built in CI (that's a separate `ingest` job) — this just
    # confirms the endpoint reports "not loaded" cleanly instead of crashing.
    response = client.get("/status")
    assert response.status_code == 200
    assert "loaded" in response.json()


def test_query_without_index_returns_empty():
    response = client.post("/query", json={"query": "test", "top_k": 3})
    assert response.status_code == 200
    body = response.json()
    assert body["chunks"] == []
    assert body["index_available"] is False
