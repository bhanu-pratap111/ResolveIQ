"""
main.py – FastAPI application entry-point for ResolveIQ AI Service.
"""

import os

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from .classifier import classify_complaint  # noqa: E402
from .schemas import (  # noqa: E402
    ClassifyRequest,
    ClassifyResponse,
    RelatedCase,
    SimilarityRequest,
    SimilarityResponse,
)
from .similarity import similarity_engine  # noqa: E402

# ---------------------------------------------------------------------------
# Application
# ---------------------------------------------------------------------------

app = FastAPI(
    title="ResolveIQ AI Service",
    description=(
        "Local AI service for complaint classification and related-case detection. "
        "Works fully offline – no paid APIs required."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@app.get("/health", tags=["Meta"])
def health() -> dict:
    """Liveness probe."""
    return {"status": "ok", "service": "ResolveIQ AI Service", "version": "1.0.0"}


@app.post("/classify", response_model=ClassifyResponse, tags=["Classification"])
def classify(req: ClassifyRequest) -> ClassifyResponse:
    """
    Classify a complaint into a category and bureau using rule-based keyword
    matching.  Returns a confidence score (relative, not calibrated) together
    with human-readable match signals.
    """
    if not req.title.strip() and not req.description.strip():
        raise HTTPException(status_code=400, detail="Title or description required")

    result = classify_complaint(req.title, req.description)
    return ClassifyResponse(**result)


@app.post("/find-related", response_model=SimilarityResponse, tags=["Similarity"])
def find_related(req: SimilarityRequest) -> SimilarityResponse:
    """
    Stub endpoint: returns an empty list.  Use ``/find-related-full`` when
    the caller can supply the full candidate pool.
    """
    return SimilarityResponse(
        related_cases=[],
        model_version=similarity_engine.MODEL_VERSION,
    )


@app.post("/find-related-full", tags=["Similarity"])
def find_related_full(body: dict) -> dict:
    """
    Full similarity search.

    Request body
    ------------
    ```json
    {
      "query": {
        "complaint_id": 42,
        "title": "...",
        "description": "...",
        "institution_id": 1,
        "category_id": 2
      },
      "candidates": [
        {
          "complaint_id": 1,
          "reference_number": "CMP-001",
          "title": "...",
          "description": "...",
          "institution_id": 1,
          "category_id": 2,
          "status": "UNDER_ACTION"
        }
      ]
    }
    ```

    Response
    --------
    Candidates ranked by TF-IDF cosine similarity above the threshold (0.15),
    with optional boost for same-institution matches.
    """
    query = body.get("query", {})
    candidates = body.get("candidates", [])

    query_text = f"{query.get('title', '')} {query.get('description', '')}"

    results = similarity_engine.find_related(
        query_text=query_text,
        candidates=candidates,
        query_institution_id=query.get("institution_id"),
        query_category_id=query.get("category_id"),
        top_k=10,
    )

    return {
        "related_cases": results,
        "model_version": similarity_engine.MODEL_VERSION,
        "query_complaint_id": query.get("complaint_id"),
    }


# ---------------------------------------------------------------------------
# Dev runner
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    port = int(os.getenv("AI_SERVICE_PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
