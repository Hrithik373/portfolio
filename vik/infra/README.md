# infra

Docker Compose (Tier 0/1 local + demo stack) + Helm chart (Tier 2 proof-of-skill).

## docker-compose.yml

Brings up the full stack on one Docker network: Kong, Keycloak, all 7
backend services, Ollama (svc-agent's local fallback model), Postgres,
MongoDB, Kafka (KRaft, no Zookeeper), ArcadeDB, ArangoDB, Prometheus, and
Grafana. `web-widget`/`web-admin` and the one-off `ingest` job are behind
Compose profiles (`dev`, `tools`) so a plain `docker compose up` brings up
just the always-on backend, matching the architecture doc's Tier 1
"always-on core" framing.

**Verified**: `docker compose config` parses cleanly; every backend service
builds; `ingest` → `svc-rag` → `eval/judge.py` end-to-end retrieval passes
100% recall@5 against the seed testset; svc-agent's Groq→Ollama fallback
chain verified live (forced a Groq auth failure, confirmed the request
automatically completed via Ollama) — see repo root README's build-status
table for exactly what's real vs. stubbed per service.

```bash
cp .env.example .env    # change the *-devpassword defaults, add a GROQ_API_KEY
docker compose run --rm ingest              # build the KB index first
docker compose up -d                        # core backend stack
docker compose exec ollama ollama pull llama3.1:8b   # one-time, ~4.9GB
docker compose --profile dev up -d web-widget web-admin
```

## prometheus.yml / grafana/

Static scrape config for all 7 Python/Java services' `/metrics` (or
`/actuator/prometheus` for svc-crm) endpoints, and one provisioned "Vik
health" dashboard (request rate, p50/p95 latency, 5xx rate — all sourced
from the shared `vik_requests_total`/`vik_request_latency_seconds` metrics
each Python service's `app/observability.py` exports). Note svc-crm uses
Micrometer's own metric names, so it won't appear on this particular
dashboard yet — a Phase 2+ TODO if that's wanted.

## helm/

A parameterized chart (one Deployment+Service+HPA template, looped over
`values.yaml`'s `services` list) covering all 7 backend services. **Verified**
with `helm lint` and `helm template` (renders 7 Deployments, 7 Services, 7
HPAs cleanly) — not applied to a live cluster, since none exists yet (see
architecture doc §9's honest hosting tiers). `imageRegistry` in
`values.yaml` is a placeholder until CI's `build` job actually pushes tagged
images.
