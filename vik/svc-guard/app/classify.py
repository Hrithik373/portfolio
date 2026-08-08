"""Intent/abuse gate: TF-IDF features -> XGBoost classifier.

Same technique as the SMS-spam-detection project (see
ingest/sources/projects/sms-spam.md), repurposed here as a production
guardrail in front of the LLM rather than a standalone spam classifier.

The training set (app/data/training_examples.jsonl) is small and
hand-written (~30 examples) — this is a real, genuinely trained model, not
a mock, but its accuracy on novel phrasing is limited until it's retrained
on real traffic logs (Phase 2 TODO: retrain periodically from Kafka-logged
turns that svc-guard itself has classified, once that pipeline exists).
"""
from __future__ import annotations

import json
from pathlib import Path

from pydantic import BaseModel
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import LabelEncoder
from xgboost import XGBClassifier

DATA_PATH = Path(__file__).parent / "data" / "training_examples.jsonl"


class ClassifyRequest(BaseModel):
    text: str


class ClassifyResponse(BaseModel):
    label: str
    confidence: float
    scores: dict[str, float]


def _load_examples() -> tuple[list[str], list[str]]:
    texts, labels = [], []
    with DATA_PATH.open(encoding="utf-8") as f:
        for line in f:
            row = json.loads(line)
            texts.append(row["text"])
            labels.append(row["label"])
    return texts, labels


class IntentClassifier:
    def __init__(self) -> None:
        texts, labels = _load_examples()
        self.vectorizer = TfidfVectorizer(ngram_range=(1, 2), min_df=1)
        X = self.vectorizer.fit_transform(texts)

        self.encoder = LabelEncoder()
        y = self.encoder.fit_transform(labels)

        self.model = XGBClassifier(
            n_estimators=100,
            max_depth=4,
            objective="multi:softprob",
            eval_metric="mlogloss",
        )
        self.model.fit(X, y)
        self.train_accuracy = float(self.model.score(X, y))

    def classify(self, text: str) -> ClassifyResponse:
        X = self.vectorizer.transform([text])
        probs = self.model.predict_proba(X)[0]
        classes = self.encoder.inverse_transform(range(len(probs)))
        scores = {label: float(p) for label, p in zip(classes, probs)}
        top_label = max(scores, key=scores.get)
        return ClassifyResponse(
            label=top_label, confidence=scores[top_label], scores=scores
        )


classifier = IntentClassifier()
