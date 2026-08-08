import asyncio
import json

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.agent import TOOLS, run
from app.judge_client import judge_answer
from app.observability import instrument
from app.retrieval_client import retrieve_context

WIDGET_ORIGIN = "http://localhost:5173"

app = FastAPI(title="vik-svc-agent")
instrument(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[WIDGET_ORIGIN],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str
    session_id: str | None = None
    # False -> plain JSON (used by eval/judge.py); True (default) -> SSE, matching the widgets.
    stream: bool = True


UNGROUNDED_FALLBACK = (
    "I don't have enough grounded information to answer that confidently — "
    "want me to flag the question to Hrithik directly?"
)


async def generate_answer(message: str) -> tuple[str, list[str], str]:
    """Retrieval -> generation -> groundedness judge -> retry/fallback.

    Matches the architecture doc's request lifecycle §3 steps 5-7. The
    answer is fully resolved server-side (not token-streamed from the LLM
    directly) so the groundedness gate can act *before* anything reaches
    the client — see main.py's docstring-equivalent note in svc-agent's
    README for why that tradeoff was made over live token streaming.

    Returns (answer, context_chunks, provider) — provider is which entry in
    agent.py's fallback chain actually answered (e.g. "groq", "ollama",
    "none"), surfaced so a Groq quota exhaustion is visibly provable rather
    than just inferred from response latency.
    """
    context_chunks = await retrieve_context(message)
    context_texts = [c.content for c in context_chunks]

    answer, provider = await run(message, context_chunks)
    if await judge_answer(answer, context_texts):
        return answer, context_texts, provider

    retried, retried_provider = await run(message, context_chunks, strict=True)
    if await judge_answer(retried, context_texts):
        return retried, context_texts, retried_provider

    return UNGROUNDED_FALLBACK, context_texts, retried_provider


async def _sse_stream(text: str):
    """Chunks the fully-resolved (retrieval+judge-gated) answer into words
    and emits them as SSE events — see generate_answer()'s docstring for
    why this is post-hoc chunking rather than live LLM token streaming."""
    for word in text.split(" "):
        yield f"data: {json.dumps({'token': word + ' '})}\n\n"
        await asyncio.sleep(0.03)
    yield f"data: {json.dumps({'done': True})}\n\n"


@app.post("/chat")
async def chat(request: ChatRequest):
    answer, context_texts, provider = await generate_answer(request.message)

    if not request.stream:
        return {"answer": answer, "context_chunks": context_texts, "provider": provider}

    return StreamingResponse(_sse_stream(answer), media_type="text/event-stream")


@app.get("/tools")
async def list_tools():
    return [{"name": t.name, "description": t.description} for t in TOOLS]


@app.post("/tools/{tool_name}")
async def call_tool(tool_name: str, payload: dict):
    tool = next((t for t in TOOLS if t.name == tool_name), None)
    if tool is None:
        return {"error": f"unknown tool '{tool_name}'"}
    return {"result": tool.func(payload.get("input", ""))}
