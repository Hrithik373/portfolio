# Vik — Full Showcase Architecture

**A microservices, agentic-RAG portfolio agent that exercises the entire Hrithik Ghosh résumé stack — from empty repo to a live, monitored deployment.**

> **Design intent (read this first).** This is deliberately a *maximalist showcase* architecture. In a real product you'd pick a subset — but the goal here is a single deployable system where **every technology on your résumé has a genuine, defensible role**, so a recruiter opening the repo sees each claim demonstrated in working code. Two honesty notes:
> 1. **DHIS2 / FHIR / ICD-10 are clinical-domain standards** from your AMINA/ITU work. Forcing them into a portfolio chatbot would read as poor judgment. They stay where they truthfully belong — as *content in Vik's knowledge base* that it can explain — not as infrastructure. Showing you know *when not* to use a technology is itself a senior signal.
> 2. **AWS + full Kubernetes is real money.** The live public demo runs lean (single node); the full K8s manifests live in the repo as proof-of-skill. See §9 for the honest cost/hosting tiers.

---

## 1. What Vik does

Vik is your AI twin embedded on `hrithikgh.vercel.app`. Visitors chat (text or voice), and it answers in your voice, grounded strictly in your real career data — experience, AMINA Care, ARA, skills, availability, sponsorship needs. It can also *act*: pull live GitHub stats, capture a recruiter lead, scan a business card, and answer in the visitor's language.

**Users:** recruiters (sponsorship, stack, availability questions), engineers (how the systems work), and you (an always-on résumé across the IST↔EU/US gap).

---

## 2. Every résumé technology → its role

| Résumé technology | Where it lives in Vik | Core / showcase |
|---|---|---|
| **Python, FastAPI** | All AI microservices (agent, RAG, guardrails, voice, eval) | Core |
| **RAG architecture, LLM orchestration & fallback chains** | Agent core + LLM layer; multi-provider fallback | Core |
| **Semantic caching** | LLM layer — cache semantically-similar queries to cut cost/latency | Core |
| **LangChain** | Agent orchestration + tool calling (GitHub, lead, card-scan) | Core |
| **Haystack** | Ingestion/indexing + retrieval pipeline (chunk → embed → index → query) | Core |
| **FAISS** | Dense vector index for fast semantic retrieval | Core |
| **LLM-as-Judge evaluation** | Output guardrail (groundedness gate) + offline eval harness — reuses ARAassistant | Core |
| **PyTorch, TensorFlow, Transformers** | Embedding model + cross-encoder reranker (PyTorch); a TF model for one component (e.g. intent) mirrors your ITU TF usage | Core |
| **Scikit-learn, XGBoost, TF-IDF, NLP** | Lightweight **intent/abuse classifier** in front of the LLM (TF-IDF features → XGBoost) — same technique as your SMS-spam project, now as a real guardrail | Core |
| **Whisper STT** | "Talk to Vik" — voice question → text | Showcase |
| **Piper / Coqui TTS** | Vik speaks answers back | Showcase |
| **NLLB translation** | Answer in the visitor's language (EN↔others) | Showcase |
| **SSE streaming** | Token streaming to the chat widget | Core |
| **Java, Spring Boot, REST** | **Lead / CRM microservice** — captures & manages recruiter leads (mirrors your Amdocs CRM/OMS work) | Showcase |
| **GraphQL** | Analytics/admin API the dashboard queries | Showcase |
| **Kong API Gateway** | Single edge — routes to all services, rate-limits the public endpoint | Core |
| **Keycloak, JWT/OIDC** | Auth for the admin dashboard (you) | Core |
| **microservices** | The whole system is service-decomposed | Core |
| **Docker** | Every service containerized | Core |
| **Kubernetes** | Orchestration; Helm chart in repo | Showcase |
| **CI/CD (GitHub Actions)** | Test → eval-gate → build → deploy | Core |
| **Prometheus, Grafana** | Metrics + dashboards (latency, cost, hit-rate) | Core |
| **AWS** | Hosting (see §9) | Core |
| **ArcadeDB** | **GraphRAG** — your career as a knowledge graph (entities: employers, projects, skills, linked). Same DB you used at ITU | Showcase |
| **ArangoDB** | Multi-model store for the **conversation-analytics graph** (query clusters, question→topic edges) | Showcase |
| **MongoDB** | Conversation history, sessions, lead documents | Core |
| **SQL (PostgreSQL)** | Structured store for the Spring Boot CRM + analytics facts | Core |
| **Apache Kafka** | Event bus — every turn emits events consumed by eval, analytics, monitoring | Showcase |
| **Apache Spark (PySpark)** | Nightly batch job over Kafka-logged turns: cluster recruiter questions, surface "most-asked" → feeds résumé tuning | Showcase |
| **TypeScript, React** | Chat widget + admin dashboard | Core |
| **OpenCV** | **Business-card scan** — recruiter uploads a card photo → OpenCV pre-process + OCR → auto-fills a lead | Showcase |
| **DHIS2 / FHIR / ICD-10** | *Knowledge-base content only* — Vik explains your AMINA integrations; not infrastructure | Content |

> On redundancy, honestly: ArcadeDB (graph+vector) and FAISS (dense index) overlap, as do ArcadeDB/ArangoDB. That's intentional for the showcase — ArcadeDB does graph traversal for GraphRAG, FAISS does the hot dense-retrieval path, ArangoDB holds the analytics graph. In a lean build you'd collapse these to one. Note that tradeoff in your README; naming it shows maturity.

---

## 3. Request lifecycle (a single chat turn)

1. **Widget → Kong.** React widget opens an SSE connection through the Kong gateway. Kong rate-limits and routes.
2. **Intent/abuse gate.** TF-IDF + XGBoost classifier scores the message: on-topic? injection? If off-topic/malicious → canned redirect, no LLM spend.
3. **(If voice)** Whisper transcribes; **(if non-English)** NLLB translates the query to the retrieval language.
4. **Agent core (LangChain).** Decides: answer from knowledge, or call a tool (`github_stats`, `capture_lead`, `scan_card`).
5. **Retrieve (Haystack).** Hybrid retrieval: FAISS dense search **+** ArcadeDB graph traversal (GraphRAG — pull the project node *and* its linked skills/employer), then cross-encoder rerank → top-k chunks.
6. **Generate (LLM layer).** Semantic-cache check first. On miss, Anthropic (Sonnet for answers, Haiku for the gates); orchestrator handles provider fallback.
7. **Output guardrail (LLM-as-Judge).** Haiku judges the answer against retrieved context for groundedness. Fail → one stricter retry or a graceful "I don't have that — want me to pass it to Hrithik?"
8. **(If voice out)** Piper/Coqui synthesizes speech.
9. **Stream** tokens back over SSE. **Emit a Kafka event** (`turn.completed`) with metadata.
10. **Persist:** MongoDB (transcript), Prometheus (metrics). Async consumers update ArangoDB analytics + eval logs.

---

## 4. Service inventory

```
vik/
├── gateway/            # Kong config, Keycloak realm
├── svc-agent/          # FastAPI + LangChain: orchestrator, tools           (Python)
├── svc-rag/            # FastAPI + Haystack: ingest, FAISS, GraphRAG query  (Python)
├── svc-guard/          # FastAPI: TF-IDF+XGBoost intent/abuse + LLM-judge   (Python)
├── svc-voice/          # FastAPI: Whisper STT, Piper/Coqui TTS              (Python)
├── svc-translate/      # FastAPI: NLLB                                       (Python)
├── svc-vision/         # FastAPI: OpenCV card-scan + OCR                     (Python)
├── svc-crm/            # Spring Boot: lead/CRM REST + GraphQL               (Java)
├── analytics/          # PySpark batch jobs (Kafka -> ArangoDB/Postgres)
├── web-widget/         # React + Vite chat widget (embed on portfolio)     (TS)
├── web-admin/          # React admin dashboard (Keycloak-gated)            (TS)
├── ingest/             # knowledge-base markdown -> Haystack pipeline
├── infra/              # Dockerfiles, docker-compose.yml, helm/, k8s/
└── .github/workflows/  # CI: test -> eval-gate -> build -> deploy
```

Each service ships its own Dockerfile and exposes `/health` + `/metrics` (Prometheus format).

---

## 5. The GraphRAG knowledge base

Model your career as a graph in ArcadeDB, not just flat chunks:

- **Nodes:** `Employer` (ITU, Amdocs), `Project` (AMINA, ARA, portfolio), `Skill` (FastAPI, RAG, Kubernetes…), `Achievement` (metrics), `Standard` (DHIS2/FHIR/ICD-10).
- **Edges:** `WORKED_AT`, `BUILT`, `USES_SKILL`, `ACHIEVED`, `INTEGRATED`.

So a query like *"Does he have production Kubernetes experience?"* traverses `Skill(Kubernetes) → BUILT ← Project(AMINA) → WORKED_AT → ITU`, returning a grounded, connected answer — not just a lexical chunk match. FAISS handles the fast semantic pass; the graph adds the relationships. This is a strong, demonstrable "GraphRAG" talking point.

**Sources ingested** (`ingest/sources/*.md`): `resume.md`, `projects/*.md`, `github/<repo>.md` (write these once — they double as your GitHub READMEs), `faq.md` (sponsorship: Germany Blue Card, NL HSM, UK Skilled Worker, Ireland Critical Skills; notice period; remote/relocation), `voice.md` (your tone).

---

## 6. Security

- **Kong** at the edge: routing, per-IP + per-session rate limits (protects your Anthropic bill), request size caps, CORS locked to your portfolio origin.
- **Keycloak** issues JWT/OIDC for the admin dashboard; public chat is anonymous but rate-limited.
- **Guardrails** in `svc-guard`: prompt-injection/jailbreak detection (reuse the pattern from your AMINA abuse-defense layer), system-prompt leak prevention, groundedness gate.
- Secrets in env / K8s secrets, never in repo. Anthropic spend alert configured.

---

## 7. Observability

- **Prometheus** scrapes `/metrics` from every service: p50/p95 latency, tokens & $ per turn, cache hit-rate, retrieval recall, guardrail trip-rate.
- **Grafana** dashboards (mirrors your ARA + ITU monitoring): a "Vik health" board + a "what recruiters ask" board fed by the PySpark analytics.
- Structured logs per turn with a trace id flowing widget → gateway → services.

---

## 8. Evaluation (your differentiator, in CI)

Reuse the ARAassistant LLM-as-Judge harness. Keep `eval/testset.jsonl` (~40 real recruiter questions + reference facts). CI scores every push on: retrieval recall@k, groundedness (% answers with zero unsupported claims), résumé-fact exactness (dates/titles/employers — zero drift), and refusal correctness (off-topic/injection). **A dropped score fails the build.** "My agent has automated eval gates" is exactly what an AI/ML hiring manager wants to hear.

---

## 9. Hosting — from scratch to live (honest tiers)

**Tier 0 — local (dev):** `docker-compose up` brings the whole stack (all services + Kafka + Mongo + Postgres + Arcade/Arango + Prometheus/Grafana) up on your machine. This is your day-to-day.

**Tier 1 — the live public demo (recommended, cheap):**
- **Frontend:** widget + admin on **Vercel** (already there).
- **Backend:** one **AWS EC2** (t3.large, ~$60/mo, or a Lightsail box, or free-tier t3.micro for a slim variant) running **k3s** (lightweight Kubernetes) — so it's *genuinely on Kubernetes* for the résumé, without EKS's ~$73/mo control-plane fee.
- Run the always-on core (gateway, agent, rag, guard, crm, mongo, postgres, one Arcade node, Prometheus/Grafana). Make the heavy showcase pieces (full Kafka cluster, Spark, voice models) **on-demand / documented** — spin up for a demo, capture screenshots + a Loom, then scale to zero. Recruiters look at the repo, the diagram, and the live chat; they won't stress-test Spark.
- Vector/embeddings: self-host `bge` in `svc-rag` → **$0 embedding cost**, Anthropic-only paid inference.

**Tier 2 — full-fat (if you want the flex / have credits):** **AWS EKS** with the Helm chart, MSK (managed Kafka), an EMR/Spark job, managed dashboards. Keep this as `helm/` in the repo and a documented `terraform/` even if you only run it briefly on AWS free credits — the *artifacts* prove the skill.

**CI/CD (GitHub Actions):** on push to `main` → run tests + `eval/` (fail on regression) → build & push images to GHCR/ECR → `helm upgrade` (or `kubectl apply`) to k3s → Vercel auto-deploys frontend.

**Go-live checklist:** CORS locked · rate limits on · `max_tokens` + per-session caps · secrets in env · `/health` uptime ping · Anthropic spend alert · widget disclaimer ("AI representative — may be imperfect").

**Realistic monthly cost (Tier 1):** ~$60 EC2 (or less on Lightsail/free-tier) + a few $ Anthropic + $0 embeddings ≈ **well under $70/mo**, and $0–5 if you use a slim free-tier node and run showcase pieces only on demand.

---

## 10. Build order (ship incrementally, never a big-bang)

**Phase 1 — working core (weekend):** `svc-rag` (Haystack + FAISS) + `svc-agent` (LangChain + Anthropic) + React widget behind Kong, on one EC2 via docker-compose. Vik answers, grounded. *Already demoable.*

**Phase 2 — production shape:** add `svc-guard` (XGBoost intent + LLM-judge), semantic cache + fallback, MongoDB persistence, Prometheus/Grafana, SSE streaming polish.

**Phase 3 — the showcase breadth:** `svc-crm` (Spring Boot) + GraphQL admin, Kafka events + PySpark analytics board, ArcadeDB GraphRAG, Keycloak admin auth.

**Phase 4 — the wow:** voice (Whisper/Piper), NLLB multilingual, OpenCV card-scan, k3s + Helm, eval-gated CI. Record a demo video and pin the repo.

---

## 11. Why this is the single best thing to build now

The system *is* the résumé, running live: agentic RAG + GraphRAG, multi-provider LLM orchestration with guardrails and eval gates, a Java/Spring service, Kafka/Spark analytics, containerized and orchestrated with full observability — every bullet on your CV, demonstrated in one deployable repo a recruiter can open, read, and *talk to*. Writing the per-repo READMEs feeds Vik's own knowledge base, so it also clears your standing GitHub action item. Build it in phases; even Phase 1 is a strong live demo.
