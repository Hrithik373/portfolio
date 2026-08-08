"""Calls svc-guard's /judge endpoint — the output groundedness gate.

Phase 1: wired into the live /chat path (see main.py), matching the
architecture doc's request lifecycle step 7: judge the answer against
retrieved context, and on failure either retry once with a stricter
prompt or fall back to an honest "I don't have that confirmed" reply
rather than serving an ungrounded answer.

If svc-guard itself is unreachable, judging fails open (treated as
grounded) rather than blocking every chat turn on a second service's
uptime — the groundedness gate is a quality improvement, not something
that should take the whole agent down if it's briefly unavailable.
"""
from __future__ import annotations

import os

import httpx

SVC_GUARD_URL = os.environ.get("SVC_GUARD_URL", "http://svc-guard:8012")


async def judge_answer(answer: str, context_chunks: list[str]) -> bool:
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{SVC_GUARD_URL}/judge",
                json={"answer": answer, "context_chunks": context_chunks},
            )
            response.raise_for_status()
            return bool(response.json().get("grounded", True))
    except (httpx.HTTPError, ValueError):
        return True
