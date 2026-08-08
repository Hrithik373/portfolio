"""Business-card preprocessing (real, working OpenCV) + OCR (stubbed interface).

The preprocessing steps below are genuinely implemented and testable with
any sample image today. OCR is intentionally left behind a small interface
(`_run_ocr`) so a real engine (Tesseract or PaddleOCR) can be dropped in
later (Phase 4 TODO) without touching the preprocessing pipeline.
"""
from __future__ import annotations

import numpy as np
from pydantic import BaseModel


class ScanResult(BaseModel):
    preprocessed: bool
    width: int
    height: int
    skew_angle_deg: float
    extracted_text: str
    ocr_available: bool


def _deskew_angle(gray: "np.ndarray") -> float:
    """Estimates skew angle from the minimum-area bounding rect of ink pixels.

    Derives the angle from the longest edge of the box returned by
    `cv2.minAreaRect` rather than trusting its raw `angle` field directly —
    that field's convention/range changed between OpenCV versions (the
    classic "angle < -45" correction formula silently breaks on OpenCV
    4.5+), whereas the longest-edge vector is version-independent.
    """
    import cv2

    thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV | cv2.THRESH_OTSU)[1]
    ys, xs = np.where(thresh > 0)
    if xs.size == 0:
        return 0.0

    coords = np.column_stack((xs, ys)).astype(np.float32)
    rect = cv2.minAreaRect(coords)
    box = cv2.boxPoints(rect)
    edge_a = box[1] - box[0]
    edge_b = box[2] - box[1]
    edge = edge_a if np.linalg.norm(edge_a) >= np.linalg.norm(edge_b) else edge_b

    angle = float(np.degrees(np.arctan2(edge[1], edge[0])) % 180)
    if angle > 90:
        angle -= 180
    if angle > 45:
        angle -= 90
    elif angle <= -45:
        angle += 90
    return angle


def _rotate(image: "np.ndarray", angle: float) -> "np.ndarray":
    import cv2

    (h, w) = image.shape[:2]
    center = (w // 2, h // 2)
    matrix = cv2.getRotationMatrix2D(center, angle, 1.0)
    return cv2.warpAffine(
        image, matrix, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE
    )


def _run_ocr(preprocessed: "np.ndarray") -> tuple[str, bool]:
    """OCR interface stub — Phase 4 TODO: wire Tesseract or PaddleOCR here."""
    try:
        import pytesseract  # noqa: F401 - Phase 4 dependency, not yet in requirements.txt
    except ImportError:
        return "", False
    raise NotImplementedError("Phase 4 TODO: run pytesseract on the preprocessed image")


def scan_card(image_bytes: bytes) -> ScanResult:
    import cv2

    array = np.frombuffer(image_bytes, dtype=np.uint8)
    image = cv2.imdecode(array, cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError("Could not decode image bytes")

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    angle = _deskew_angle(gray)
    deskewed = _rotate(gray, angle)
    thresholded = cv2.adaptiveThreshold(
        deskewed,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        blockSize=31,
        C=15,
    )

    text, ocr_available = _run_ocr(thresholded)
    height, width = thresholded.shape[:2]
    return ScanResult(
        preprocessed=True,
        width=int(width),
        height=int(height),
        skew_angle_deg=round(angle, 2),
        extracted_text=text,
        ocr_available=ocr_available,
    )
