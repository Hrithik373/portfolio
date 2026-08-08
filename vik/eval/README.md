# eval

CI eval-gate — reuses ARA's LLM-as-Judge pattern (see
`../ingest/sources/projects/ara.md`).

## Status

| Piece | Status |
|---|---|
| Retrieval recall@k against svc-rag (`testset.jsonl`, 12 seed questions) | Functional, hard-gates the build (`RECALL_THRESHOLD`) |
| Groundedness scoring (svc-agent generates a real answer, svc-guard judges it) | Functional, but informational-only in CI (no `GROQ_API_KEY` secret configured there — both services fail open without one, so it's a plumbing smoke test, not a real quality signal, until a key is added). Real locally. |
| Résumé-fact exactness checks (zero date/employer drift) | Not implemented — needs a structured fact checklist to diff against `ingest/sources/resume.md` |
| Refusal correctness (off-topic/injection) | Covered indirectly by svc-guard's own classifier training set today, not yet a CI-gated eval here, and not yet wired into svc-agent's live request path either (see svc-guard/README.md) |

## Run locally

```
pip install -r requirements.txt
python ../ingest/index_kb.py            # build the index svc-rag reads
export GROQ_API_KEY=gsk_...             # for a real groundedness signal
# start svc-rag (:8011), svc-agent (:8010), svc-guard (:8012), then:
python judge.py
```
