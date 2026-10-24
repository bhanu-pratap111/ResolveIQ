"""
similarity.py – TF-IDF cosine-similarity engine for related-case detection.

All processing is in-memory and requires no external APIs.
"""

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from .preprocessor import preprocess_text

SIMILARITY_THRESHOLD = 0.15


class ComplaintSimilarityEngine:
    """Lightweight TF-IDF engine that scores candidate complaints against a query."""

    MODEL_VERSION = "tfidf-ngram-v1.0"

    def __init__(self) -> None:
        self.vectorizer = TfidfVectorizer(
            max_features=5000,
            ngram_range=(1, 2),
            min_df=1,
            sublinear_tf=True,
        )

    def find_related(
        self,
        query_text: str,
        candidates: list,
        query_institution_id: int | None = None,
        query_category_id: int | None = None,
        top_k: int = 10,
    ) -> list:
        """
        Find complaints in *candidates* that are textually similar to *query_text*.

        Parameters
        ----------
        query_text : str
            Concatenated title + description of the complaint being looked up.
        candidates : list[dict]
            Each dict must have keys: complaint_id, reference_number, title,
            description, institution_id, category_id, status.
        query_institution_id : int | None
            If provided, candidates from the same institution receive a 1.3×
            score boost (capped at 1.0).
        query_category_id : int | None
            If provided, candidates with the same category are labelled with
            an extra match reason.
        top_k : int
            Maximum number of results to return.

        Returns
        -------
        list[dict]  – sorted by similarity_score descending, above threshold.
        """
        if not candidates:
            return []

        query_processed = preprocess_text(query_text)
        candidate_texts = [
            preprocess_text(f"{c['title']} {c['description']}") for c in candidates
        ]

        all_texts = [query_processed] + candidate_texts

        try:
            tfidf_matrix = self.vectorizer.fit_transform(all_texts)
            query_vec = tfidf_matrix[0]
            candidate_vecs = tfidf_matrix[1:]
            similarities = cosine_similarity(query_vec, candidate_vecs)[0]
        except Exception:
            return []

        results: list[dict] = []
        for score, candidate in zip(similarities, candidates):
            if score < SIMILARITY_THRESHOLD:
                continue

            reasons: list[str] = []
            if score >= 0.5:
                reasons.append("Very similar complaint description")
            elif score >= 0.3:
                reasons.append("Similar complaint description")
            else:
                reasons.append("Partially matching description")

            if query_institution_id and candidate.get("institution_id") == query_institution_id:
                reasons.append("Same institution")
                score = min(float(score) * 1.3, 1.0)  # boost for same institution

            if query_category_id and candidate.get("category_id") == query_category_id:
                reasons.append("Same complaint category")

            results.append(
                {
                    "complaint_id": candidate["complaint_id"],
                    "reference_number": candidate.get("reference_number", ""),
                    "title": candidate["title"],
                    "similarity_score": round(float(score), 4),
                    "match_reasons": reasons,
                    "institution_id": candidate.get("institution_id"),
                    "category_id": candidate.get("category_id"),
                    "status": candidate.get("status", ""),
                }
            )

        results.sort(key=lambda x: x["similarity_score"], reverse=True)
        return results[:top_k]


# Module-level singleton (re-created per request since fit_transform is stateless here)
similarity_engine = ComplaintSimilarityEngine()
