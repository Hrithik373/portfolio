# Project: SMS Spam Detection Engine

Role: ML classification.

## Description

A text classification pipeline for SMS spam detection.

- Preprocessing with Python, Pandas, NumPy.
- Text cleaning, tokenization, and TF-IDF feature extraction with NLTK / spaCy.
- Models: Logistic Regression, Naïve Bayes, SVM, Random Forest, XGBoost (via
  scikit-learn).
- Handled class imbalance with SMOTE and class-weight tuning; hyperparameter search
  with GridSearchCV and cross-validation.
- Evaluated with F1 and ROC-AUC; visualized with Matplotlib / Seaborn.
- Optional Flask/Streamlit deployment.

## Stack

Python, scikit-learn, NLTK, XGBoost

## Links

- GitHub: https://github.com/Hrithik373/sms-spam-detection
- Live demo: https://sms-spam-detection-uxuz5fe9icdlakvxvnvccy.streamlit.app/

## Why it matters for Vik

`svc-guard`'s intent/abuse gate (TF-IDF features → XGBoost classifier) is the same
technique used here, now repurposed as a production guardrail in front of an LLM
instead of a standalone spam classifier.
