"""LangChain agent orchestrator — real reasoning (Phase 1) with a
multi-provider fallback chain (per the architecture doc's LLM-layer design).

Groq (llama-3.3-70b-versatile by default) is primary. Ollama, running
locally in the same Docker Compose stack, is the fallback — no API key, no
external quota, ever, just slower on CPU-only inference. Both go through
`ChatGroq`/`ChatOllama`'s native tool-calling support instead of the
earlier FakeListLLM + hand-rolled ReAct-text-parsing setup.

Retrieval (svc-rag) happens *before* this module is invoked — see
`retrieval_client.py` and `main.py` — and the retrieved chunks are
injected into the system prompt as grounding context, per the
architecture doc's request lifecycle (§3, steps 4-6).
"""
from __future__ import annotations

import os

from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_groq import ChatGroq
from langchain_ollama import ChatOllama

from app.retrieval_client import ContextChunk
from app.tools.capture_lead import capture_lead_tool
from app.tools.github_stats import github_stats_tool
from app.tools.scan_card import scan_card_tool

ANSWER_MODEL = os.environ.get("GROQ_MODEL_ANSWER", "llama-3.3-70b-versatile")
OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "llama3.1:8b")

NOT_CONFIGURED_MESSAGE = (
    "I'm Vik, but no reasoning provider is configured on this deployment "
    "yet — the agent loop, tools, and retrieval are all real, just not "
    "connected to a live model here."
)

# Every provider in the chain failing (free-tier quota exhaustion, Ollama's
# model not pulled yet, a network blip) is a real, expected constraint, not
# a bug — this keeps that from ever surfacing as a raw 500 to the visitor,
# matching the "fail honestly, never crash" pattern used everywhere else in
# this codebase (svc-rag's retrieval, svc-guard's judge, the frontend's
# offline handling).
UPSTREAM_ERROR_MESSAGE = "Vik's reasoning is temporarily unavailable — please try again in a bit."

SYSTEM_PROMPT = """You are Vik, Hrithik Ghosh's AI agent, embedded on his portfolio site. \
You answer questions about his career — experience, projects, and skills — grounded \
strictly in the context below, retrieved from his real résumé and project notes.

Context retrieved for this question (may be empty if nothing matched):
{context}

Rules:
- Answer only from the context above (and ordinary conversational replies like greetings). \
Never invent facts, dates, employers, metrics, or details not present in the context.
- If the context doesn't contain the answer, say so plainly and offer to flag the question \
to Hrithik directly — don't guess or fill gaps.
- If a fact in the context is marked NEEDS REVIEW or NEEDS INPUT, hedge rather than asserting \
it confidently — say the exact date/detail isn't confirmed yet.
- You may use your tools (github_stats, capture_lead, scan_card) when they would genuinely \
help answer the question or move the conversation forward — not gratuitously, and be honest \
that they currently return placeholder data (Phase 2/3/4 TODOs, not live yet).
- Stay warm, calm, and precise — never corporate-stiff, but always careful about facts, \
especially anything about sponsorship, visas, or notice period, which isn't confirmed yet.
- You are Vik, an AI agent — never claim to literally be Hrithik.{strict_suffix}"""

STRICT_SUFFIX = (
    "\n- STRICT MODE: your previous answer may have included claims not clearly supported "
    "by the context. Be extremely conservative this time — only state what is verbatim or "
    "obviously implied by the context, and say plainly when you don't have something confirmed."
)

TOOLS = [github_stats_tool, capture_lead_tool, scan_card_tool]

PROMPT = ChatPromptTemplate.from_messages(
    [
        ("system", SYSTEM_PROMPT),
        ("human", "{input}"),
        MessagesPlaceholder("agent_scratchpad"),
    ]
)


def _build_agent_executor(llm: BaseChatModel) -> AgentExecutor:
    agent = create_tool_calling_agent(llm=llm, tools=TOOLS, prompt=PROMPT)
    return AgentExecutor(agent=agent, tools=TOOLS, handle_parsing_errors=True)


def _build_providers() -> list[tuple[str, AgentExecutor]]:
    providers: list[tuple[str, AgentExecutor]] = []

    groq_key = os.environ.get("GROQ_API_KEY")
    if groq_key:
        providers.append(
            ("groq", _build_agent_executor(ChatGroq(model=ANSWER_MODEL, api_key=groq_key, temperature=0.4)))
        )

    # Always added, even if the Ollama container isn't reachable or hasn't
    # pulled OLLAMA_MODEL yet — ChatOllama doesn't validate connectivity at
    # construction time, only on first call, which run() already catches.
    providers.append(
        ("ollama", _build_agent_executor(ChatOllama(model=OLLAMA_MODEL, base_url=OLLAMA_BASE_URL, temperature=0.4)))
    )
    return providers


PROVIDERS = _build_providers()


def _format_context(chunks: list[ContextChunk]) -> str:
    if not chunks:
        return "(no matching context retrieved for this question)"
    return "\n\n".join(f"[{c.source}] {c.content.strip()}" for c in chunks)


async def run(query: str, context_chunks: list[ContextChunk], strict: bool = False) -> tuple[str, str]:
    """Returns (answer, provider_used) — the provider name is real
    observability (logged and surfaced in /chat's non-streaming response),
    not just inferred from response latency, since Ollama vs. Groq timing
    alone isn't a reliable enough signal to depend on."""
    if not PROVIDERS:
        return NOT_CONFIGURED_MESSAGE, "none"

    payload = {
        "input": query,
        "context": _format_context(context_chunks),
        "strict_suffix": STRICT_SUFFIX if strict else "",
    }

    failures = []
    for name, executor in PROVIDERS:
        try:
            result = await executor.ainvoke(payload)
            print(f"[agent] answered via provider={name}")
            return result["output"], name
        except Exception as exc:  # noqa: BLE001 - intentional: try the next provider on *any* failure
            print(f"[agent] provider={name} failed: {exc.__class__.__name__}: {exc}")
            failures.append(f"{name} ({exc.__class__.__name__})")

    return f"{UPSTREAM_ERROR_MESSAGE} (tried: {', '.join(failures)})", "none"
