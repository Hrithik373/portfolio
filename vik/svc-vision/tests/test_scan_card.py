import cv2
import numpy as np
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def _sample_card_png() -> bytes:
    image = np.full((300, 500, 3), 255, dtype=np.uint8)
    cv2.putText(
        image, "Hrithik Ghosh", (30, 150), cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 0, 0), 3
    )
    ok, buf = cv2.imencode(".png", image)
    assert ok
    return buf.tobytes()


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "svc-vision"}


def test_scan_card_preprocesses_real_image():
    response = client.post(
        "/scan-card",
        files={"file": ("card.png", _sample_card_png(), "image/png")},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["preprocessed"] is True
    assert body["width"] == 500
    assert body["height"] == 300
    # Unrotated synthetic text should deskew to ~0 degrees.
    assert abs(body["skew_angle_deg"]) < 1.0
    assert body["ocr_available"] is False
