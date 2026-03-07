import os
from functools import lru_cache
from typing import List

import joblib

# Go three levels up from this file (inference -> expertise_service -> services)
# to reach the project root, then into models/ expertise_recommendation
PROJECT_ROOT = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "..")
)

MODEL_DIR = os.path.join(PROJECT_ROOT, "models", "expertise_recommendation")


@lru_cache(maxsize=1)
def _load_vectorizer_and_model():
    """
    Loads the TF-IDF vectorizer and Logistic Regression model.

    Place your exported artifacts from Colab as:
      - models/expertise_recommendation/tfidf_vectorizer.joblib
      - models/expertise_recommendation/logistic_model.joblib
    """
    vectorizer_path = os.path.join(MODEL_DIR, "tfidf_vectorizer.joblib")
    model_path = os.path.join(MODEL_DIR, "logistic_model.joblib")

    if not os.path.exists(vectorizer_path) or not os.path.exists(model_path):
        raise FileNotFoundError(
            f"Model files not found in {MODEL_DIR}. "
            "Expected 'tfidf_vectorizer.joblib' and 'logistic_model.joblib'."
        )

    vectorizer = joblib.load(vectorizer_path)
    model = joblib.load(model_path)
    return vectorizer, model


def predict_issue_category(text: str) -> str:
    """
    Predicts the issue category using the loaded model.
    """
    vectorizer, model = _load_vectorizer_and_model()
    X = vectorizer.transform([text])
    pred = model.predict(X)[0]
    return str(pred)


def predict_issue_proba(text: str) -> List[float]:
    """
    Optional: returns probability distribution over classes.
    """
    vectorizer, model = _load_vectorizer_and_model()
    X = vectorizer.transform([text])
    proba = model.predict_proba(X)[0].tolist()
    return proba


