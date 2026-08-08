"""Eval harness — the CI eval-gate referenced in the architecture doc §8/§10.

Reuses the LLM-as-Judge pattern from ARA (see
ingest/sources/projects/ara.md). Two dimensions now:

1. Retrieval recall@k against svc-rag — hard-gated, fails the build below
   RECALL_THRESHOLD (this was already real in Phase 0).
2. Groundedness — svc-agent generates a real answer (Groq-backed, Phase 1)
   for each question, svc-guard's real LLM-as-Judge scores it against the
   retrieved context. Printed as informational output, not yet
   hard-gating the build: CI runs without a GROQ_API_KEY secret configured,
   where both services fail open (svc-agent returns its "not configured"
   message, svc-guard judges anything as grounded) — that's a legitimate
   smoke test that the plumbing doesn't crash, but not a real quality
   signal, so it shouldn't fail the build on a threshold yet. Local runs
   with a real key get a real signal.

Résumé-fact exactness (dates/employers/titles — zero drift) is still a
TODO: needs a structured checklist of facts to diff against
ingest/sources/resume.md, not built yet.

Run with:  python judge.py
Exits non-zero (failing the CI eval-gate job) if recall@k drops below
RECALL_THRESHOLD.
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

import requests

SVC_RAG_URL = os.environ.get("SVC_RAG_URL", "http://localhost:8011")
SVC_AGENT_URL = os.environ.get("SVC_AGENT_URL", "http://localhost:8010")
SVC_GUARD_URL = os.environ.get("SVC_GUARD_URL", "http://localhost:8012")
TESTSET_PATH = Path(__file__).parent / "testset.jsonl"
TOP_K = 5
RECALL_THRESHOLD = float(os.environ.get("RECALL_THRESHOLD", "0.5"))


def load_testset() -> list[dict]:
    with TESTSET_PATH.open(encoding="utf-8") as f:
        return [json.loads(line) for line in f]


def recall_at_k(question: str, expected_source: str) -> bool:
    response = requests.post(
        f"{SVC_RAG_URL}/query",
        json={"query": question, "top_k": TOP_K},
        timeout=30,
    )
    response.raise_for_status()
    chunks = response.json()["chunks"]
    return any(chunk["source"] == expected_source for chunk in chunks)


def groundedness(question: str) -> tuple[bool, str, str]:
    """Generates a real answer via svc-agent, then judges it via svc-guard.

    Returns (grounded, reason, provider). Raises requests.RequestException if
    either service is unreachable — caller decides how to treat that
    (informational metric, so a service outage degrades the printed
    summary, not the gate).

    Timeout is generous (120s) because svc-agent's provider fallback chain
    (see svc-agent/app/agent.py) may land on the local Ollama model when
    Groq's free-tier quota is exhausted, and CPU-only inference through a
    multi-step tool-calling agent loop is genuinely slow — not a bug to
    paper over with a short timeout.
    """
    chat_res = requests.post(
        f"{SVC_AGENT_URL}/chat",
        json={"message": question, "stream": False},
        timeout=120,
    )
    chat_res.raise_for_status()
    body = chat_res.json()

    judge_res = requests.post(
        f"{SVC_GUARD_URL}/judge",
        json={"answer": body["answer"], "context_chunks": body["context_chunks"]},
        timeout=30,
    )
    judge_res.raise_for_status()
    judged = judge_res.json()
    return bool(judged["grounded"]), str(judged.get("reason", "")), str(body.get("provider", "?"))


def main() -> None:
    testset = load_testset()
    hits = 0
    results = []

    for item in testset:
        try:
            hit = recall_at_k(item["question"], item["expected_source"])
        except requests.RequestException as exc:
            print(f"ERROR querying svc-rag for {item['question']!r}: {exc}")
            sys.exit(2)
        hits += hit
        results.append((item["question"], item["expected_source"], hit))

    for question, expected, hit in results:
        mark = "PASS" if hit else "FAIL"
        print(f"[{mark}] expected={expected!r:35} {question}")

    recall = hits / len(testset)
    print(f"\nretrieval recall@{TOP_K}: {recall:.2f} ({hits}/{len(testset)})")
    print(f"threshold: {RECALL_THRESHOLD:.2f}")

    print("\n--- groundedness (informational — see module docstring) ---")
    grounded_count = 0
    checked = 0
    for item in testset:
        try:
            grounded, reason, provider = groundedness(item["question"])
        except requests.RequestException as exc:
            print(f"  ERROR generating/judging {item['question']!r}: {exc}")
            continue
        checked += 1
        grounded_count += grounded
        mark = "GROUNDED" if grounded else "UNGROUNDED"
        print(f"  [{mark}] ({provider}) {item['question']} — {reason}")

    if checked:
        print(f"\ngroundedness: {grounded_count / checked:.2f} ({grounded_count}/{checked})")
    else:
        print("\ngroundedness: skipped (svc-agent/svc-guard unreachable)")

    if recall < RECALL_THRESHOLD:
        print("\nEVAL GATE FAILED (recall@k below threshold)")
        sys.exit(1)
    print("\nEVAL GATE PASSED")


if __name__ == "__main__":
    main()
