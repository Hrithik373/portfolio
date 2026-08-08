# svc-translate

NLLB-based multilingual translation.

## Status

| Piece | Status |
|---|---|
| `/health`, `/metrics` | Functional |
| `POST /translate` | Route wired end-to-end; returns `501` by default (`LOAD_MODELS=false`) |
| Real NLLB model | Not implemented — Phase 4. Deliberately not in `requirements.txt`; see `app/models.py`. |

## Run locally

```
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8014
```

## API

- `GET /health`
- `POST /translate` — `{"text": "...", "target_lang": "en"}` → `{"translated": "...", "target_lang": "..."}` (or `501` while gated)
