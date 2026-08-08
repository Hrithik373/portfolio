# analytics

PySpark batch job clustering recruiter questions into topics — feeds the
"what recruiters ask" Grafana board and, longer-term, résumé tuning.

## Status

| Piece | Status |
|---|---|
| `cluster_questions.py` (Tokenizer → StopWordsRemover → TF-IDF → KMeans) | Functional, runs end-to-end on `fixtures/recruiter_questions.jsonl` |
| Reading from live Kafka (`turn.completed` topic) instead of a fixture | Not implemented — Phase 3 TODO |
| Writing results to ArangoDB instead of stdout | Not implemented — Phase 3 TODO |
| Scheduled nightly run | Not implemented — this is a manually-invoked script, not a cron job, until it's reading real data |

## Run locally

```
pip install -r requirements.txt
spark-submit cluster_questions.py
# or: python cluster_questions.py  (pyspark ships a local SparkSession)
```
