from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.models import ModelNotLoaded, translate
from app.observability import instrument

WIDGET_ORIGIN = "http://localhost:5173"

app = FastAPI(title="vik-svc-translate")
instrument(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[WIDGET_ORIGIN],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


class TranslateRequest(BaseModel):
    text: str
    target_lang: str = "en"


@app.post("/translate")
async def translate_route(request: TranslateRequest):
    try:
        translated = translate(request.text, request.target_lang)
    except ModelNotLoaded as exc:
        return Response(content=str(exc), status_code=501)
    return {"translated": translated, "target_lang": request.target_lang}
