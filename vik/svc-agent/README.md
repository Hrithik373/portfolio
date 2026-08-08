# svc-agent

LangChain agent orchestrator + tool calling + real reasoning with a
multi-provider fallback chain.

## Status

| Piece | Status |
|---|---|
| `/health`, `/metrics` | Functional |
| `AgentExecutor` + tool-calling loop + tool registry | Real LangChain objects (`create_tool_calling_agent`, not the earlier hand-rolled ReAct-text parsing) |
| Real reasoning, multi-provider fallback chain | Functional — Groq (`llama-3.3-70b-versatile`) primary, local Ollama (`llama3.1:8b`, no API key/quota ever) fallback. Verified live: forced a Groq 401 and confirmed the request automatically fell through to Ollama and answered correctly. If every provider fails (or none are configured), returns a clear message instead of crashing. |
| Retrieval grounding (calls svc-rag before generating) | Functional — see `retrieval_client.py` |
| Output groundedness gate (calls svc-guard's judge, retries once stricter, else honest fallback) | Functional — see `generate_answer()` in `main.py` |
| `github_stats`, `capture_lead`, `scan_card` tools | Callable, still return canned data — not wired to svc-crm/svc-vision/GitHub API yet (Phase 2/3/4) |
| `POST /chat` SSE streaming | Functional wire format — but see note below on what's actually streaming |
| Semantic cache | Not implemented — Phase 2 |

### Why `/chat` isn't token-streamed straight from the LLM

The answer is fully resolved server-side — retrieved, generated, judged, and
retried if needed — *before* anything is sent to the client, then chunked
word-by-word over SSE (same wire format as before). This trades live
token-by-token output for making sure the groundedness gate can act (and
retry) before the client sees anything, rather than having to un-say part of
an answer that already streamed. A future pass could stream real tokens
speculatively and only replace them on a failed judge check, but that's
meaningfully more complex than this first real-reasoning pass needed.

### Why Ollama, and why it's slow

Groq's free tier has a real daily token cap, and generation + judging
(svc-guard also calls Groq) share the same quota — it's genuinely possible
to exhaust it during normal use, not just heavy testing. Ollama running
locally in the same Docker Compose stack (see `infra/docker-compose.yml`)
has no key and no external quota, so it's always available as a fallback —
but CPU-only inference through a multi-step tool-calling agent loop is slow
(can take a minute or more per answer on a machine with no GPU). That's an
accepted tradeoff for the fallback path specifically, not the primary one.

First-time setup: `docker compose exec ollama ollama pull llama3.1:8b`
(≈4.9GB, one-time; persisted in the `ollama_data` volume after that).

## Run locally

```
pip install -r requirements.txt
export GROQ_API_KEY=gsk_...          # https://console.groq.com/keys — optional, see below
export OLLAMA_BASE_URL=http://localhost:11434
export OLLAMA_MODEL=llama3.1:8b
export SVC_RAG_URL=http://localhost:8011
export SVC_GUARD_URL=http://localhost:8012
uvicorn app.main:app --reload --port 8010
```

`GROQ_API_KEY` is optional — Ollama alone is a valid (if slower) provider
chain. If neither Groq nor a reachable Ollama is available, `/chat` returns
a clear "reasoning is temporarily unavailable" message rather than a 500.

## API

- `GET /health`
- `POST /chat` — `{"message": "...", "stream": true}` → `text/event-stream` of `{"token": "..."}` events, terminated by `{"done": true}`. `{"stream": false}` → plain JSON `{"answer": "...", "context_chunks": [...], "provider": "groq"|"ollama"|"none"}` (used by `eval/judge.py`; `provider` is real observability into which link in the fallback chain actually answered).
- `GET /tools` — list registered tools
- `POST /tools/{tool_name}` — `{"input": "..."}` → call a tool directly, bypassing the agent loop
