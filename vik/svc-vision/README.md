# svc-vision

Business-card scan: OpenCV preprocessing + OCR.

## Status

| Piece | Status |
|---|---|
| `/health`, `/metrics` | Functional |
| `POST /scan-card` — grayscale, deskew (`minAreaRect`-based angle estimate + rotation), adaptive threshold | Functional, real OpenCV, testable with any image today |
| OCR extraction | Stubbed behind `_run_ocr()` in `app/card_scan.py` — returns empty text with `ocr_available: false` until Tesseract/PaddleOCR is wired (Phase 4) |

## Run locally

```
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8015
```

## API

- `GET /health`
- `POST /scan-card` — multipart image upload → `{"preprocessed": true, "width": ..., "height": ..., "skew_angle_deg": ..., "extracted_text": "", "ocr_available": false}`
