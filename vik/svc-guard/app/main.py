from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.classify import ClassifyRequest, ClassifyResponse, classifier
from app.judge import JudgeRequest, JudgeResponse, judge
from app.observability import instrument

WIDGET_ORIGIN = "http://localhost:5173"

app = FastAPI(title="vik-svc-guard")
instrument(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[WIDGET_ORIGIN],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


@app.get("/status")
async def status():
    return {"train_accuracy": classifier.train_accuracy}


@app.post("/classify", response_model=ClassifyResponse)
async def classify(request: ClassifyRequest) -> ClassifyResponse:
    return classifier.classify(request.text)


@app.post("/judge", response_model=JudgeResponse)
async def judge_answer(request: JudgeRequest) -> JudgeResponse:
    return judge(request)
