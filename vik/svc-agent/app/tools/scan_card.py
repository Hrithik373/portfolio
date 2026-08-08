"""scan_card tool.

Phase 0: stub. Phase 4 TODO: forward an uploaded business-card image to
svc-vision's `/scan-card` endpoint (OpenCV preprocessing + OCR) and fold the
extracted fields into a capture_lead call.

Uses the `@tool` decorator (not the legacy `Tool(func=...)` wrapper) so the
generated JSON schema names the real parameter instead of a synthetic
`__arg1` — Groq's tool-calling validation rejects the latter.
"""
import json

from langchain_core.tools import tool


@tool
def scan_card(image_ref: str) -> str:
    """Scan a business card image and extract contact details. Input: a
    reference/URL to the uploaded image."""
    return json.dumps(
        {
            "scanned": False,
            "note": "stub — not yet wired to svc-vision's /scan-card endpoint (Phase 4 TODO)",
            "image_ref": image_ref,
        }
    )


scan_card_tool = scan_card
