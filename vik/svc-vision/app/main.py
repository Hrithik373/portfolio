from fastapi import FastAPI, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from app.card_scan import ScanResult, scan_card
from app.observability import instrument

WIDGET_ORIGIN = "http://localhost:5173"

app = FastAPI(title="vik-svc-vision")
instrument(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[WIDGET_ORIGIN],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


@app.post("/scan-card", response_model=ScanResult)
async def scan_card_route(file: UploadFile) -> ScanResult:
    image_bytes = await file.read()
    return scan_card(image_bytes)
