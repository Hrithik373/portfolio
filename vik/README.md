# Vik

Hrithik Ghosh's AI agent — a microservices, agentic-RAG portfolio agent
where every technology on his résumé has a genuine, working role. Full
design rationale, request lifecycle, and the honest cost/hosting tiers live
in [`ARCHITECTURE.md`](./ARCHITECTURE.md) (the original design doc this repo
implements). This file is the practical "what's here and how to run it"
companion.

## Build status

Phase 0 (scaffold) is done; Phase 1 (real reasoning + retrieval grounding +
groundedness evaluation) is now in too. Each service's README spells out
exactly which of its endpoints do real work today versus which are wired
stubs waiting on a later phase (see the architecture doc §10's build order).
Summary:

| Service | Real today | Stubbed / Phase TODO |
|---|---|---|
| [`svc-rag`](./svc-rag) | Haystack + FAISS dense retrieval (self-hosted `bge-small-en-v1.5`) — **verified 100% recall@5 against the eval testset** | GraphRAG (ArcadeDB), cross-encoder reranking |
| [`svc-agent`](./svc-agent) | Real reasoning with a multi-provider fallback chain (Groq primary, local Ollama fallback — verified live by forcing a Groq auth failure and confirming automatic failover), retrieval-grounded (calls svc-rag), output groundedness-gated with a strict retry (calls svc-guard), `create_tool_calling_agent` + 3 tools, SSE wire format | Semantic cache, tools not wired to other services, live token-level streaming (currently generate→judge→then-stream, see svc-agent/README.md) |
| [`svc-guard`](./svc-guard) | TF-IDF + XGBoost intent/abuse classifier, genuinely trained; `/judge` is a real Groq-backed LLM-as-Judge call | `/classify` not yet gating svc-agent's live request path |
| [`svc-crm`](./svc-crm) | Spring Boot REST + GraphQL + JPA, tested end-to-end | Keycloak-gated writes, svc-agent's `capture_lead` tool not yet wired to it |
| [`svc-vision`](./svc-vision) | Real OpenCV preprocessing (deskew, threshold), tested against a synthetic card image | OCR extraction (Tesseract/PaddleOCR) |
| [`svc-voice`](./svc-voice) | Routes wired end-to-end | Whisper/Piper/Coqui models (deliberately not installed — see the service README) |
| [`svc-translate`](./svc-translate) | Route wired end-to-end | NLLB model (same reasoning as svc-voice) |
| [`analytics`](./analytics) | PySpark KMeans clustering job, runs on a fixture | Reading from live Kafka, writing to ArangoDB |
| [`web-widget`](./web-widget) | `<VikChat/>` streams real SSE from svc-agent | Embedding on the actual portfolio site |
| [`web-admin`](./web-admin) | Queries svc-crm's GraphQL for leads | Real Keycloak token exchange |
| [`gateway`](./gateway) | Kong routing/CORS/rate-limiting, Keycloak realm seed | JWT validation on svc-crm's write routes |
| [`infra/helm`](./infra/helm) | Lints and renders cleanly (`helm template`) for all 7 backend services | Not applied to a live cluster |
| [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) | test → eval-gate → build (pushes to GHCR) all real | `deploy` job intentionally disabled — no cluster to deploy to yet |

## Quickstart

```bash
cd vik
cp infra/.env.example infra/.env    # then edit the passwords, add a GROQ_API_KEY
docker compose -f infra/docker-compose.yml run --rm ingest   # build the KB index
docker compose -f infra/docker-compose.yml up -d             # core stack
docker compose -f infra/docker-compose.yml exec ollama ollama pull llama3.1:8b   # one-time, ~4.9GB — svc-agent's fallback model
docker compose -f infra/docker-compose.yml --profile dev up -d web-widget web-admin
```

Then:
- Chat widget: http://localhost:5173
- Admin dashboard: http://localhost:5174
- Kong proxy: http://localhost:8000 (admin API: `:8001`)
- Keycloak: http://localhost:8080
- Grafana: http://localhost:3000 ("Vik" folder → "Vik health" dashboard)
- Prometheus: http://localhost:9090

Re-run the `ingest` step any time `ingest/sources/*.md` changes.

## Deploying to Render

`render.yaml` (repo root, alongside the portfolio's existing Node API
service) defines the full Python/Java service inventory as Render
Blueprint services: Kong, svc-agent, svc-rag, svc-guard, svc-crm (+ a
managed Postgres), svc-voice, svc-translate, svc-vision — all free tier.

**Deliberately not part of this Blueprint** (each for a different reason,
not just "left out"):

| Piece | Why not |
|---|---|
| Ollama | Needs several GB RAM + a persistent disk for the model; free tier (≈512MB RAM, ephemeral disk) can't run it. svc-agent on Render is Groq-only — already tested to degrade gracefully (not crash) if the quota is hit. |
| Kafka, ArcadeDB, ArangoDB | No always-free managed option exists for any of them, and nothing in the live code path reads/writes them yet (Phase 3 TODOs) — deploying empty, disconnected infrastructure has no value. |
| MongoDB | No Render-native offering; self-hosting on free tier loses all data on every restart (ephemeral disk). The real fix is a free MongoDB Atlas cluster — needs your own sign-up, not something this repo can set up for you. Not wired into any live code path yet either. |
| Keycloak, Prometheus, Grafana | Technically deployable, but need the same class of env-var/scrape-target templating as Kong's did, and none sit on the live chat path yet. Deferred, not blocked — straightforward follow-up. |

**Setup** (Blueprint services need manual approval in Render's dashboard the
first time, and every `sync: false` secret needs its real value set there —
neither is something that can be done from a repo):

1. Push this branch, then in Render: New → Blueprint → select this repo.
   Render will list the new `vik-*` services and `vik-postgres` alongside
   the existing `hrithik-portfolio-api` — approve them.
2. Set `GROQ_API_KEY` on `vik-svc-agent` and `vik-svc-guard` (same key
   works for both — get one free at console.groq.com).
3. Check `vik-svc-crm`'s `DB_URL` once it's deployed — see the comment in
   `svc-crm/src/main/resources/application.yml`; Render's Postgres
   connection-string property may need a `jdbc:` prefix added by hand.
4. If Render appended a collision suffix to any planned service name
   (`vik-kong`, `vik-svc-agent`, etc.), update the cross-service URLs in
   `vik-kong`'s env vars and the `/vik-api` rewrite in the root
   `vercel.json` to match the real hostname.

None of this has been confirmed live from this session — I can build and
locally verify the deploy configs (Docker builds succeed, the `PORT`
contract works, Kong's template substitution produces valid config), but
not Render's actual networking or build environment. Report back what
Render's dashboard shows and I'll fix forward from there.

## Why the KB content needs your review

`ingest/sources/resume.md` and `faq.md` were drafted from the live portfolio
site and résumé PDF, and both files flag real discrepancies inline:

- Amdocs end date: site says `10/2022`, PDF résumé says `10/2023`.
- West Bengal Youth Computer Center: site says `01/2023–06/2025`, PDF says a
  single month, `06/2025`.
- Sponsorship/visa/notice-period/relocation info doesn't exist in either
  source at all — `faq.md` marks this `NEEDS INPUT FROM HRITHIK`.

Vik is instructed (via `voice.md`) to hedge on anything marked
`NEEDS REVIEW`/`NEEDS INPUT` rather than assert it confidently. Resolve
these in the source markdown, then re-run `ingest`.

## Repo layout

See `ARCHITECTURE.md` §4 for the full service inventory and rationale. Each
service directory has its own `README.md` with an accurate status table —
that's the source of truth for what's real versus stubbed, not this file.
