"""
tests/test_classifier.py – Unit tests for the rule-based complaint classifier.
"""

import sys
import os

# Allow running from the project root without package install
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.classifier import classify_complaint  # noqa: E402


def test_fee_complaint():
    result = classify_complaint(
        "Fee refund not given",
        "I paid the tuition fee but the college is not giving refund",
    )
    assert result["suggested_category"] == "Fee Irregularities"
    assert result["confidence"] > 0


def test_harassment_complaint():
    result = classify_complaint(
        "Ragging in hostel",
        "Senior students are bullying and harassing juniors in hostel",
    )
    assert result["suggested_category"] == "Harassment"


def test_unknown_complaint():
    result = classify_complaint("xyz", "abc")
    assert result["fallback"] is True


def test_academic_complaint():
    result = classify_complaint(
        "Wrong marks in result",
        "My semester exam marks are wrong, need revaluation",
    )
    assert result["suggested_category"] in ["Academic Issues", "Examination Malpractice"]


def test_infrastructure_complaint():
    result = classify_complaint(
        "Hostel water supply broken",
        "There is no water in the hostel bathrooms since two weeks",
    )
    assert result["suggested_category"] == "Infrastructure Problems"


def test_administrative_complaint():
    result = classify_complaint(
        "Migration certificate not issued",
        "The administration office is not releasing my migration certificate despite repeated requests",
    )
    assert result["suggested_category"] == "Administrative Issues"


def test_confidence_label_high():
    result = classify_complaint(
        "Sexual harassment by faculty",
        "A professor is sexually harassing female students and discriminating on gender basis",
    )
    assert result["confidence_label"] in ("HIGH", "MEDIUM")


def test_match_signals_present():
    result = classify_complaint(
        "Exam paper leaked before exam",
        "The question paper was leaked before the examination and cheating was widespread",
    )
    assert len(result["match_signals"]) >= 1
