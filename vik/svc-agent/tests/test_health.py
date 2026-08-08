from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "svc-agent"}


def test_tools_lists_all_three():
    response = client.get("/tools")
    assert response.status_code == 200
    names = {tool["name"] for tool in response.json()}
    assert names == {"github_stats", "capture_lead", "scan_card"}


def test_chat_streams_tokens():
    response = client.post("/chat", json={"message": "hi"})
    assert response.status_code == 200
    assert "data:" in response.text
    assert '"done": true' in response.text
