"""LLM-as-Judge groundedness gate — real implementation (Phase 1).

Scores svc-agent's answer against the context chunks svc-rag retrieved for
it, using the same rubric dimension ARA's evaluator uses (see
ingest/sources/projects/ara.md): does the answer make any claim not
supported by the context? Uses Groq's free-tier API directly (not
LangChain — one JSON-mode chat call doesn't need an agent framework).

Fails *open* (grounded=True) if GROQ_API_KEY isn't set or the call errors,
so a judge outage degrades to "un-gated" rather than blocking every chat
turn — see judge_client.py on the svc-agent side for the matching
fail-open behavior when svc-guard itself is unreachable.
"""
import json
import os

from groq import Groq
from pydantic import BaseModel

JUDGE_MODEL = os.environ.get("GROQ_MODEL_JUDGE", "llama-3.3-70b-versatile")

# Groundedness judging needs real reading comprehension across several
# retrieved chunks, not simple classification — an 8B "instant" model was
# measurably unreliable here (flagged facts as unsupported that were
# verbatim in the context), so this defaults to the same model tier as
# svc-agent's own reasoning, not the cheaper/faster tier the architecture
# doc originally sketched for guardrail calls in general.
JUDGE_PROMPT = """You are a fact-checking judge for an AI agent's answers. Be precise, not \
pedantic: paraphrasing, summarizing, or combining facts that ARE in the context is grounded. \
Only flag a claim as ungrounded if it introduces a fact — a date, employer, project detail, \
model name, metric, or similar — that does not appear anywhere in the context, even loosely.

Context retrieved for the question (the source of truth the agent should draw from):
{context}

The agent's answer to judge:
{answer}

Read the context carefully before deciding — check whether each claim in the answer actually \
appears in the context first. Ordinary conversational replies (greetings, offers to help, \
honest "I don't have that confirmed" answers) always count as grounded.

Respond with ONLY a JSON object, no other text: {{"grounded": true or false, "reason": "<one \
short sentence citing what was or wasn't found in the context>"}}"""


class JudgeRequest(BaseModel):
    answer: str
    context_chunks: list[str] = []


class JudgeResponse(BaseModel):
    grounded: bool
    reason: str


_client: Groq | None = None
_client_checked = False


def _get_client() -> Groq | None:
    global _client, _client_checked
    if not _client_checked:
        api_key = os.environ.get("GROQ_API_KEY")
        _client = Groq(api_key=api_key) if api_key else None
        _client_checked = True
    return _client


def judge(request: JudgeRequest) -> JudgeResponse:
    client = _get_client()
    if client is None:
        return JudgeResponse(grounded=True, reason="GROQ_API_KEY not set — judge fails open")

    context = "\n\n".join(request.context_chunks) or "(no context was retrieved for this question)"
    prompt = JUDGE_PROMPT.format(context=context, answer=request.answer)

    try:
        completion = client.chat.completions.create(
            model=JUDGE_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
            response_format={"type": "json_object"},
        )
        data = json.loads(completion.choices[0].message.content)
        return JudgeResponse(
            grounded=bool(data.get("grounded", True)),
            reason=str(data.get("reason", "")),
        )
    except Exception as exc:  # noqa: BLE001 - any judge failure fails open, not the request
        return JudgeResponse(grounded=True, reason=f"judge call failed, failing open: {exc}")
