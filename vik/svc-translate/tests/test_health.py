from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "svc-translate"}


def test_translate_returns_501_when_models_gated():
    response = client.post("/translate", json={"text": "hello", "target_lang": "fr"})
    assert response.status_code == 501
