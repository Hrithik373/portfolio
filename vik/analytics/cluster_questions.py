"""PySpark batch job: cluster recruiter questions into topics.

Phase 0: reads a local JSONL fixture (fixtures/recruiter_questions.jsonl) —
synthetic sample questions, not real traffic. Phase 3 TODO: read from the
`turn.completed` Kafka topic that every real chat turn emits (see
architecture doc §3 step 9) instead of a static file, and write cluster
results to ArangoDB's conversation-analytics graph instead of stdout.

Run with:  spark-submit cluster_questions.py
"""
from __future__ import annotations

from pathlib import Path

from pyspark.ml.clustering import KMeans
from pyspark.ml.feature import CountVectorizer, IDF, StopWordsRemover, Tokenizer
from pyspark.sql import SparkSession

FIXTURE_PATH = Path(__file__).parent / "fixtures" / "recruiter_questions.jsonl"
NUM_CLUSTERS = 4


def main() -> None:
    spark = SparkSession.builder.appName("vik-recruiter-question-clustering").getOrCreate()

    df = spark.read.json(str(FIXTURE_PATH))

    tokenizer = Tokenizer(inputCol="question", outputCol="words")
    words = tokenizer.transform(df)

    remover = StopWordsRemover(inputCol="words", outputCol="filtered")
    filtered = remover.transform(words)

    vectorizer = CountVectorizer(inputCol="filtered", outputCol="raw_features")
    cv_model = vectorizer.fit(filtered)
    featurized = cv_model.transform(filtered)

    idf = IDF(inputCol="raw_features", outputCol="features")
    idf_model = idf.fit(featurized)
    rescaled = idf_model.transform(featurized)

    kmeans = KMeans(k=NUM_CLUSTERS, seed=42, featuresCol="features")
    model = kmeans.fit(rescaled)
    clustered = model.transform(rescaled)

    print(f"\nClustered {df.count()} recruiter questions into {NUM_CLUSTERS} topics:\n")
    for row in clustered.select("prediction", "question").collect():
        print(f"  [cluster {row['prediction']}] {row['question']}")

    spark.stop()


if __name__ == "__main__":
    main()
