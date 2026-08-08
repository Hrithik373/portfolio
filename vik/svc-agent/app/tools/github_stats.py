"""github_stats tool.

Phase 0: returns canned data so the tool-calling wire format is provable
without spending a GitHub API rate-limit budget. Phase 2 TODO: call the
real GitHub REST API (repo stars/last-push/languages) for
github.com/Hrithik373/<repo>.

Uses the `@tool` decorator (not the legacy `Tool(func=...)` wrapper) so the
generated JSON schema names the real parameter (`repo`) instead of a
synthetic `__arg1` — Groq's tool-calling validation rejects the latter.
"""
import json

from langchain_core.tools import tool


@tool
def github_stats(repo: str) -> str:
    """Get stats (stars, last push, languages) for one of Hrithik's public
    GitHub repos. Input: the repo name, e.g. 'ARAassistant'."""
    return json.dumps(
        {
            "repo": repo or "ARAassistant",
            "stars": 0,
            "note": "stub data — GitHub API integration is a Phase 2 TODO",
        }
    )


github_stats_tool = github_stats
