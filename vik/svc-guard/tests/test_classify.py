from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "svc-guard"}


def test_status_reports_training_accuracy():
    response = client.get("/status")
    assert response.status_code == 200
    assert 0.0 <= response.json()["train_accuracy"] <= 1.0


def test_classify_on_topic_question():
    response = client.post("/classify", json={"text": "What companies has he worked at?"})
    assert response.status_code == 200
    body = response.json()
    assert body["label"] in {"on_topic", "off_topic", "injection"}
    assert 0.0 <= body["confidence"] <= 1.0


def test_judge_stub_returns_grounded():
    response = client.post("/judge", json={"answer": "some answer", "context_chunks": []})
    assert response.status_code == 200
    assert response.json()["grounded"] is True
