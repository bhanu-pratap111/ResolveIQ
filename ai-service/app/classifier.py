"""
classifier.py – Rule-based complaint classifier using keyword matching.

Confidence is a relative match score in [0, 1] derived from keyword overlap
and category weight.  It is NOT a calibrated probability.
"""

from .preprocessor import preprocess_text

# ---------------------------------------------------------------------------
# Category rule definitions
# ---------------------------------------------------------------------------

CATEGORY_RULES = [
    {
        "category": "Academic Issues",
        "category_id": 1,
        "bureau": "Academic Affairs Bureau",
        "bureau_id": 1,
        "keywords": [
            "result", "marks", "grade", "semester", "examination", "exam",
            "syllabus", "curriculum", "attendance", "professor", "lecturer",
            "teaching", "faculty", "assignment", "project", "thesis", "degree",
            "certificate", "backlog", "revaluation", "supplementary", "practical",
        ],
        "weight": 1.0,
    },
    {
        "category": "Fee Irregularities",
        "category_id": 2,
        "bureau": "Fee & Finance Bureau",
        "bureau_id": 3,
        "keywords": [
            "fee", "fees", "tuition", "refund", "receipt", "payment",
            "scholarship", "stipend", "hostel fee", "bus fee", "money",
            "amount", "paid", "charge", "overcharged", "excess", "demand",
            "donation", "capitation",
        ],
        "weight": 1.2,
    },
    {
        "category": "Infrastructure Problems",
        "category_id": 3,
        "bureau": "Infrastructure Bureau",
        "bureau_id": 2,
        "keywords": [
            "hostel", "classroom", "lab", "library", "toilet", "bathroom",
            "canteen", "food", "electricity", "water", "wifi", "internet",
            "facility", "building", "maintenance", "repair", "equipment",
            "infrastructure", "transport", "bus",
        ],
        "weight": 1.0,
    },
    {
        "category": "Examination Malpractice",
        "category_id": 4,
        "bureau": "Examination Bureau",
        "bureau_id": 4,
        "keywords": [
            "cheating", "malpractice", "copying", "unfair", "examiner",
            "answer sheet", "paper leak", "question paper", "evaluation",
            "recheck", "appeal", "invigilator", "irregularity",
            "misconduct exam",
        ],
        "weight": 1.3,
    },
    {
        "category": "Harassment",
        "category_id": 5,
        "bureau": "Student Welfare Bureau",
        "bureau_id": 5,
        "keywords": [
            "harass", "harassment", "ragging", "bully", "bullying", "threaten",
            "abuse", "sexual", "mental", "pressure", "forced", "unsafe",
            "discrimination", "caste", "gender", "religion", "intimidate",
        ],
        "weight": 1.5,
    },
    {
        "category": "Faculty Misconduct",
        "category_id": 6,
        "bureau": "Academic Affairs Bureau",
        "bureau_id": 1,
        "keywords": [
            "faculty", "teacher", "professor", "absent", "absentee",
            "irregular", "inappropriate", "biased", "favouritism",
            "favoritism", "partial", "misconduct faculty", "unprofessional",
        ],
        "weight": 1.2,
    },
    {
        "category": "Administrative Issues",
        "category_id": 7,
        "bureau": "Academic Affairs Bureau",
        "bureau_id": 1,
        "keywords": [
            "admission", "document", "certificate", "migration", "noc",
            "transfer", "registration", "enrolment", "enrollment",
            "administration", "office", "principal", "management", "dean",
            "hod", "staff",
        ],
        "weight": 1.0,
    },
]

# Maximum possible weight across all rules (used for normalisation)
_MAX_WEIGHT = max(r["weight"] for r in CATEGORY_RULES)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def classify_complaint(title: str, description: str) -> dict:
    """
    Rule-based classifier using keyword matching with weighted scoring.

    The title is doubled in the combined text so that title keywords receive
    roughly twice the influence of description keywords.

    Returns a dict compatible with ``ClassifyResponse``.

    confidence is a relative match score in [0, 1]; it is NOT a calibrated
    probability.  Use ``confidence_label`` ("HIGH" / "MEDIUM" / "LOW") for
    a human-readable interpretation.
    """
    # Weight the title 2× by repeating it
    combined = preprocess_text(f"{title} {title} {description}")

    scores: list[dict] = []
    for rule in CATEGORY_RULES:
        matched = [kw for kw in rule["keywords"] if kw in combined]
        if matched:
            raw_score = len(matched) / len(rule["keywords"]) * rule["weight"]
            scores.append(
                {
                    "category": rule["category"],
                    "category_id": rule["category_id"],
                    "bureau": rule["bureau"],
                    "bureau_id": rule["bureau_id"],
                    "raw_score": raw_score,
                    "matched_keywords": matched,
                }
            )

    if not scores:
        return {
            "suggested_category": "Other",
            "suggested_category_id": 8,
            "suggested_bureau": "Academic Affairs Bureau",
            "suggested_bureau_id": 1,
            "confidence": 0.0,
            "confidence_label": "LOW",
            "match_signals": ["No specific keywords matched; manual triage recommended"],
            "fallback": True,
        }

    # Normalise to [0, 1]
    best = max(scores, key=lambda x: x["raw_score"])
    confidence = min(best["raw_score"] / _MAX_WEIGHT, 1.0)

    if confidence >= 0.3:
        label = "HIGH"
    elif confidence >= 0.15:
        label = "MEDIUM"
    else:
        label = "LOW"

    signals = [f"Matched keywords: {', '.join(best['matched_keywords'][:5])}"]
    if len(scores) > 1:
        second = sorted(scores, key=lambda x: x["raw_score"], reverse=True)[1]
        signals.append(f"Also considered: {second['category']}")

    return {
        "suggested_category": best["category"],
        "suggested_category_id": best["category_id"],
        "suggested_bureau": best["bureau"],
        "suggested_bureau_id": best["bureau_id"],
        "confidence": round(confidence, 4),
        "confidence_label": label,
        "match_signals": signals,
        "fallback": confidence < 0.15,
    }
