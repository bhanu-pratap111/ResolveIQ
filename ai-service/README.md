# ResolveIQ AI Service

A lightweight, **fully offline** Python FastAPI service that provides:

1. **Complaint Classification** – rule-based keyword scoring (no paid ML API required).
2. **Related-Case Detection** – TF-IDF cosine similarity over candidate complaints supplied by the backend.

---

## Quick Start

### 1. Install dependencies

```bash
cd ai-service
pip install -r requirements.txt
```

### 2. Configure (optional)

```bash
cp .env.example .env
# Edit .env to change the port if needed (default: 8000)
```

### 3. Run the service

**Windows**
```bat
start.bat
```

**Linux / macOS**
```bash
bash start.sh
```

**Or directly**
```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 4. Verify

```
GET http://localhost:8000/health
```

Interactive docs: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## API Endpoints

### `GET /health`
Liveness probe.

```json
{"status": "ok", "service": "ResolveIQ AI Service", "version": "1.0.0"}
```

---

### `POST /classify`
Classify a complaint into a category and bureau.

**Request**
```json
{
  "title": "Fee refund not given",
  "description": "I paid the tuition fee but the college is refusing to refund"
}
```

**Response**
```json
{
  "suggested_category": "Fee Irregularities",
  "suggested_category_id": 2,
  "suggested_bureau": "Fee & Finance Bureau",
  "suggested_bureau_id": 3,
  "confidence": 0.32,
  "confidence_label": "HIGH",
  "match_signals": ["Matched keywords: fee, fees, tuition, refund, paid"],
  "fallback": false
}
```

> **Note on `confidence`**: This is a *relative* keyword-overlap score (0–1), **not** a calibrated probability.  
> Use `confidence_label` (`"HIGH"` / `"MEDIUM"` / `"LOW"`) for human-readable interpretation.

---

### `POST /find-related-full`
Find complaints in a candidate pool that are textually similar to a query complaint.

**Request**
```json
{
  "query": {
    "complaint_id": 42,
    "title": "College collected extra fees",
    "description": "College demanded capitation and is refusing refund",
    "institution_id": 1,
    "category_id": 2
  },
  "candidates": [
    {
      "complaint_id": 1,
      "reference_number": "CMP-001",
      "title": "Fee refund not processed",
      "description": "College took excess fee and not giving refund",
      "institution_id": 1,
      "category_id": 2,
      "status": "UNDER_ACTION"
    }
  ]
}
```

**Response**
```json
{
  "related_cases": [
    {
      "complaint_id": 1,
      "reference_number": "CMP-001",
      "title": "Fee refund not processed",
      "similarity_score": 0.6312,
      "match_reasons": ["Similar complaint description", "Same institution", "Same complaint category"],
      "institution_id": 1,
      "category_id": 2,
      "status": "UNDER_ACTION"
    }
  ],
  "model_version": "tfidf-ngram-v1.0",
  "query_complaint_id": 42
}
```

---

## How It Works

### Classifier (rule-based keyword scoring)

1. The complaint title (weighted ×2) and description are preprocessed: lowercased, punctuation stripped, stopwords removed.
2. Each of 7 category rules contains a keyword list and a weight (1.0–1.5).
3. The fraction of matched keywords × weight gives a raw score.
4. The best-scoring category is selected; its raw score is normalised by the maximum possible weight (1.5) to yield a `confidence` in [0, 1].
5. If no keywords match at all, the complaint falls back to **"Other"** with `fallback: true`.

**Thresholds**

| confidence | label  |
|-----------|--------|
| ≥ 0.30    | HIGH   |
| ≥ 0.15    | MEDIUM |
| < 0.15    | LOW    |

### Similarity Engine (TF-IDF cosine similarity)

1. The query text and all candidate texts are preprocessed.
2. A `TfidfVectorizer` (unigrams + bigrams, up to 5 000 features, sublinear TF) is fit on all texts at request time.
3. Cosine similarity between the query vector and each candidate vector is computed.
4. Candidates scoring below **0.15** are discarded.
5. Candidates from the same institution as the query receive a **1.3× score boost** (capped at 1.0).
6. Results are returned sorted by score (descending), up to 10 matches.

---

## Running Tests

```bash
cd ai-service
pytest
```

---

## Limitations & Extension Notes

| Limitation | How to extend |
|---|---|
| Keyword rules are hand-crafted | Train a text classifier (e.g., `SGDClassifier` or `LogisticRegression`) on labelled complaint data using `classifier.py` as the label source. |
| TF-IDF similarity is fit per request | Build a persistent index (e.g., FAISS or `sklearn` `NearestNeighbors`) trained on all complaints nightly. |
| No multi-lingual support | Add a translation step (e.g., `googletrans`, `argostranslate`) before `preprocess_text`. |
| Confidence is not a probability | Use Platt scaling or isotonic regression after collecting labelled data to produce calibrated probabilities. |

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `AI_SERVICE_PORT` | `8000` | Port the Uvicorn server listens on |
