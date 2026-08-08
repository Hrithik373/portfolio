# svc-guard

Intent/abuse gate (TF-IDF + XGBoost) + LLM-as-Judge groundedness gate.

## Status

| Piece | Status |
|---|---|
| `/health`, `/metrics` | Functional |
| `/classify` — TF-IDF + XGBoost, trained at startup on `app/data/training_examples.jsonl` | Functional, genuinely trained (~30 hand-written examples — accuracy on real traffic is unproven until retrained on logs) |
| `/judge` groundedness gate | Functional — real Groq call (`llama-3.3-70b-versatile` by default), JSON-mode rubric scoring against the provided context. Deliberately *not* on the cheaper "instant" tier — that measurably hallucinated ungrounded verdicts on facts that were verbatim in the context, since cross-referencing several retrieved chunks needs real reading comprehension, not simple classification. Fails *open* (`grounded: true`) if `GROQ_API_KEY` is unset or the call errors — a judge outage shouldn't block every chat turn. |
| Intent/abuse `/classify` gating svc-agent's `/chat` in the live request path | Not wired yet — `/classify` works standalone today, but svc-agent doesn't call it before generating. Natural next increment. |

## Run locally

```
pip install -r requirements.txt
export GROQ_API_KEY=gsk_...          # https://console.groq.com/keys
uvicorn app.main:app --reload --port 8012
```

## API

- `GET /health`
- `GET /status` → training accuracy of the currently-loaded classifier
- `POST /classify` → `{"text": "..."}` → `{"label": "on_topic"|"off_topic"|"injection", "confidence": 0.0-1.0, "scores": {...}}`
- `POST /judge` → `{"answer": "...", "context_chunks": [...]}` → `{"grounded": bool, "reason": "..."}`
