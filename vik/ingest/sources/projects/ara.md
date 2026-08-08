# Project: Agentic RAG Evaluator (ARA)

Role: RAG pipeline & evaluation. Featured project on the portfolio site.

## Description

A production-ready Agentic Retrieval-Augmented Generation (RAG) system with
document-grounded evaluation, built using LangChain, FAISS, OpenAI LLMs, and
Streamlit.

- Built an end-to-end retrieval pipeline: PDF ingestion → chunking → vector indexing →
  agentic LLM reasoning with conversation-aware execution.
- Implemented an LLM-as-Judge framework scoring relevance, faithfulness, groundedness,
  latency, and overall quality.
- Deployed a cloud-ready Streamlit interface with a metrics dashboard, optimized for
  lightweight CPU deployment.

## Stack

LangChain, FAISS, OpenAI, Streamlit

## Links

- GitHub: https://github.com/Hrithik373/ARAassistant
- Live demo: https://araassistant-ky7xiosunekrfmu427tt2f.streamlit.app/

## Why it matters for Vik

Vik's own evaluation harness (`vik/eval/`) reuses this exact LLM-as-Judge pattern
(relevance / faithfulness / groundedness scoring) as its CI eval gate — Vik is a
direct descendant of ARA's evaluation approach, not just described by it.
