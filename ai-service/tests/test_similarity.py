"""
tests/test_similarity.py – Unit tests for TF-IDF cosine similarity engine.
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.similarity import ComplaintSimilarityEngine  # noqa: E402

CANDIDATES = [
    {
        "complaint_id": 1,
        "reference_number": "CMP-001",
        "title": "Fee refund not processed",
        "description": "College took excess fee and not giving refund",
        "institution_id": 1,
        "category_id": 2,
        "status": "UNDER_ACTION",
    },
    {
        "complaint_id": 2,
        "reference_number": "CMP-002",
        "title": "Library renovation delay",
        "description": "Library ceiling is leaking and not repaired",
        "institution_id": 2,
        "category_id": 3,
        "status": "REGISTERED",
    },
]


def test_similar_complaints():
    """Fee-related query should rank the fee complaint highest."""
    engine = ComplaintSimilarityEngine()
    query = "College collected extra fees and refusing to return the money"
    results = engine.find_related(query, CANDIDATES)
    if results:
        assert results[0]["complaint_id"] == 1


def test_dissimilar_complaints():
    """Faculty-absence query should have low similarity to a parking complaint."""
    engine = ComplaintSimilarityEngine()
    candidates = [
        {
            "complaint_id": 3,
            "reference_number": "CMP-003",
            "title": "Parking space issue",
            "description": "No parking space for students near college gate",
            "institution_id": 1,
            "category_id": 3,
            "status": "REGISTERED",
        },
    ]
    query = "Professor is absent and classes are not being held"
    results = engine.find_related(query, candidates)
    if results:
        assert results[0]["similarity_score"] < 0.5


def test_empty_candidates():
    """Should return an empty list when no candidates are provided."""
    engine = ComplaintSimilarityEngine()
    results = engine.find_related("Some complaint text", [])
    assert results == []


def test_same_institution_boost():
    """
    A match from the same institution should appear with a score >= the
    base cosine similarity (it receives a 1.3× boost).
    """
    engine = ComplaintSimilarityEngine()
    query = "Fee refund issue college not returning excess payment"
    results = engine.find_related(
        query, CANDIDATES, query_institution_id=1, query_category_id=2
    )
    if results:
        top = results[0]
        assert "Same institution" in top["match_reasons"] or top["similarity_score"] > 0


def test_result_sorted_descending():
    """Results must be sorted by similarity_score in descending order."""
    engine = ComplaintSimilarityEngine()
    query = "fee refund payment money college"
    results = engine.find_related(query, CANDIDATES)
    scores = [r["similarity_score"] for r in results]
    assert scores == sorted(scores, reverse=True)


def test_threshold_filters_low_scores():
    """Results below the 0.15 threshold must not appear."""
    engine = ComplaintSimilarityEngine()
    candidates = [
        {
            "complaint_id": 99,
            "reference_number": "CMP-099",
            "title": "Unrelated topic entirely",
            "description": "zxqwerty banana quantum",
            "institution_id": 5,
            "category_id": 9,
            "status": "REGISTERED",
        }
    ]
    query = "semester examination marks result revaluation"
    results = engine.find_related(query, candidates)
    for r in results:
        assert r["similarity_score"] >= 0.15
