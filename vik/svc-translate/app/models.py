"""Gated model loading for translation (NLLB).

Same rationale as svc-voice/app/models.py: `transformers` + an NLLB
checkpoint are multi-GB and not worth pulling on every scaffold build, so
the model is lazy-imported and gated behind `LOAD_MODELS=true`. Phase 4
TODO: add `transformers`/`sentencepiece` to requirements.txt and implement
the real NLLB translation call.
"""
import os

LOAD_MODELS = os.environ.get("LOAD_MODELS", "false").lower() == "true"


class ModelNotLoaded(Exception):
    pass


def translate(text: str, target_lang: str) -> str:
    if not LOAD_MODELS:
        raise ModelNotLoaded(
            "Translation model loading is disabled (LOAD_MODELS=false). "
            "Phase 4 TODO: bundle transformers + an NLLB checkpoint and flip the flag."
        )
    try:
        import transformers  # noqa: F401 - Phase 4 dependency, not yet in requirements.txt
    except ImportError as exc:
        raise ModelNotLoaded(
            "transformers package not installed — Phase 4 TODO"
        ) from exc
    raise NotImplementedError("Phase 4 TODO: run NLLB translation on text")
