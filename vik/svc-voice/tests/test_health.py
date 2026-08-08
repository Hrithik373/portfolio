from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "svc-voice"}


def test_tts_returns_501_when_models_gated():
    response = client.post("/tts", json={"text": "hello"})
    assert response.status_code == 501
