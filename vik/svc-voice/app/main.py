from fastapi import FastAPI, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.models import ModelNotLoaded, synthesize, transcribe
from app.observability import instrument

WIDGET_ORIGIN = "http://localhost:5173"

app = FastAPI(title="vik-svc-voice")
instrument(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[WIDGET_ORIGIN],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


class TTSRequest(BaseModel):
    text: str


@app.post("/stt")
async def stt(file: UploadFile):
    audio_bytes = await file.read()
    try:
        text = transcribe(audio_bytes)
    except ModelNotLoaded as exc:
        return Response(content=str(exc), status_code=501)
    return {"text": text}


@app.post("/tts")
async def tts(request: TTSRequest):
    try:
        audio_bytes = synthesize(request.text)
    except ModelNotLoaded as exc:
        return Response(content=str(exc), status_code=501)
    return Response(content=audio_bytes, media_type="audio/wav")
