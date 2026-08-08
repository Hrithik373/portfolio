# svc-voice

Whisper STT / Piper-Coqui TTS.

## Status

| Piece | Status |
|---|---|
| `/health`, `/metrics` | Functional |
| `POST /stt`, `POST /tts` | Routes wired end-to-end; return `501` by default (`LOAD_MODELS=false`) |
| Real Whisper/Piper/Coqui models | Not implemented — Phase 4. Deliberately not in `requirements.txt` so the container builds fast; see `app/models.py`. |

## Run locally

```
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8013
# LOAD_MODELS=true only once whisper/piper deps are actually added (Phase 4)
```

## API

- `GET /health`
- `POST /stt` — multipart file upload → `{"text": "..."}` (or `501` while gated)
- `POST /tts` — `{"text": "..."}` → `audio/wav` bytes (or `501` while gated)
