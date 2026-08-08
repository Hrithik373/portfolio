"""capture_lead tool.

Phase 0: validates input and returns an acknowledgement without persisting
anywhere. Phase 3 TODO: POST to svc-crm's `/leads` REST endpoint so the lead
lands in Postgres and shows up in web-admin.

Uses the `@tool` decorator (not the legacy `Tool(func=...)` wrapper) so the
generated JSON schema names the real parameter instead of a synthetic
`__arg1` — Groq's tool-calling validation rejects the latter.
"""
import json

from langchain_core.tools import tool


@tool
def capture_lead(input_str: str) -> str:
    """Capture a recruiter's contact details so Hrithik can follow up. Input:
    free text containing name, email, and what they're interested in."""
    return json.dumps(
        {
            "captured": False,
            "note": (
                "stub — not yet wired to svc-crm's /leads endpoint (Phase 3 TODO); "
                "input received: " + input_str
            ),
        }
    )


capture_lead_tool = capture_lead
