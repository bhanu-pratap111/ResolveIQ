from pydantic import BaseModel
from typing import Optional, List


class ClassifyRequest(BaseModel):
    title: str
    description: str
    complaint_id: Optional[int] = None


class ClassifyResponse(BaseModel):
    suggested_category: str
    suggested_category_id: Optional[int]
    suggested_bureau: str
    suggested_bureau_id: Optional[int]
    confidence: float          # 0.0 to 1.0 (rule-based score, NOT a calibrated probability)
    confidence_label: str      # "HIGH", "MEDIUM", "LOW"
    match_signals: List[str]
    fallback: bool             # True if uncertain


class SimilarityRequest(BaseModel):
    complaint_id: int
    title: str
    description: str
    institution_id: Optional[int] = None
    category_id: Optional[int] = None


class RelatedCase(BaseModel):
    complaint_id: int
    reference_number: str
    title: str
    similarity_score: float
    match_reasons: List[str]
    institution_id: Optional[int]
    category_id: Optional[int]
    status: str


class SimilarityResponse(BaseModel):
    related_cases: List[RelatedCase]
    model_version: str
