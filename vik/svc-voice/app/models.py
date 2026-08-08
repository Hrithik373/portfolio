"""Gated model loading for STT (Whisper) and TTS (Piper/Coqui).

Phase 0: neither `openai-whisper`/`faster-whisper` nor a Piper/Coqui runtime
is in requirements.txt — pulling multi-GB model weights on every container
build/start isn't something a portfolio scaffold should do by default. Both
paths are lazy-imported and gated behind `LOAD_MODELS=true`, so the routes
exist and are wired end-to-end (Phase 4 TODO: add the real packages to
requirements.txt and flip the env flag once this ships for real).
"""
import os

LOAD_MODELS = os.environ.get("LOAD_MODELS", "false").lower() == "true"


class ModelNotLoaded(Exception):
    pass


def transcribe(audio_bytes: bytes) -> str:
    if not LOAD_MODELS:
        raise ModelNotLoaded(
            "STT model loading is disabled (LOAD_MODELS=false). "
            "Phase 4 TODO: bundle openai-whisper/faster-whisper and flip the flag."
        )
    try:
        import whisper  # noqa: F401 - Phase 4 dependency, not yet in requirements.txt
    except ImportError as exc:
        raise ModelNotLoaded(
            "whisper package not installed — Phase 4 TODO"
        ) from exc
    raise NotImplementedError("Phase 4 TODO: run whisper.transcribe on audio_bytes")


def synthesize(text: str) -> bytes:
    if not LOAD_MODELS:
        raise ModelNotLoaded(
            "TTS model loading is disabled (LOAD_MODELS=false). "
            "Phase 4 TODO: bundle Piper/Coqui TTS and flip the flag."
        )
    try:
        import piper  # noqa: F401 - Phase 4 dependency, not yet in requirements.txt
    except ImportError as exc:
        raise ModelNotLoaded("piper package not installed — Phase 4 TODO") from exc
    raise NotImplementedError("Phase 4 TODO: synthesize text with Piper/Coqui")
