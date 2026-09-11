# PhishGuard API Reference

This document details the RESTful API endpoints provided by the PhishGuard FastAPI backend (`http://localhost:8000`).

---

## Base Information

- **Base URL:** `http://localhost:8000`
- **Protocol:** HTTP/JSON
- **CORS Allowed Origins:** `http://localhost:3000`, `http://localhost:5173`, `http://127.0.0.1:5173`
- **Interactive Documentation:** `http://localhost:8000/docs` (Swagger UI) / `http://localhost:8000/redoc` (ReDoc)

---

## Endpoints Summary

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | API root & model readiness status |
| `GET` | `/health` | Application health check endpoint |
| `GET` | `/api/status` | ML predictor detailed operational status |
| `POST` | `/api/scan` | Execute full 22-feature ML scan & threat analysis on URL |
| `GET` | `/api/history` | Paginated scan history with filtering & search |
| `GET` | `/api/report/{scan_id}` | Detailed report lookup for a specific scan ID |
| `DELETE` | `/api/history/{scan_id}` | Delete specific scan record from database |
| `GET` | `/api/analytics` | Aggregated scan analytics, risk distributions, daily trends |
| `GET` | `/api/models/compare` | Evaluation metrics, metadata, feature importances for all 4 models |
| `GET` | `/api/models/feature-importance` | Feature importance rankings for tree-based ML models |

---

## Core Endpoints Detail

### 1. System Health & Status

#### `GET /`
Returns basic metadata and model readiness.

- **Response `200 OK`**:
```json
{
  "name": "PhishGuard API",
  "version": "1.0.0",
  "status": "running",
  "models_loaded": true,
  "docs": "/docs"
}
```

#### `GET /health`
Used for container or process health checks.

- **Response `200 OK`**:
```json
{
  "status": "healthy",
  "models_loaded": true
}
```

#### `GET /api/status`
Returns ML model predictor readiness and metadata.

- **Response `200 OK`**:
```json
{
  "is_loaded": true,
  "loaded_models": ["logistic_regression", "decision_tree", "random_forest", "gradient_boosting"],
  "best_model_name": "random_forest"
}
```

---

### 2. URL Scanner

#### `POST /api/scan`
Executes full phishing detection pipeline: URL validation -> 22 local feature extraction -> ML ensemble prediction -> risk scoring -> explainability -> SQLite storage.

- **Request Body (`application/json`):**
```json
{
  "url": "http://paypal-security-update.account-verification-login.com/auth"
}
```

- **Response `200 OK`**:
```json
{
  "id": 14,
  "url": "http://paypal-security-update.account-verification-login.com/auth",
  "risk_score": 88,
  "verdict": "Phishing",
  "confidence": 0.94,
  "created_at": "2026-09-11T14:30:00.000000",
  "features": {
    "url_length": 68,
    "domain_length": 51,
    "path_length": 5,
    "num_dots": 2,
    "num_hyphens": 3,
    "num_underscores": 0,
    "num_slashes": 3,
    "num_query_params": 0,
    "num_fragments": 0,
    "num_at_symbols": 0,
    "has_ip_address": 0,
    "has_https": 0,
    "has_www": 0,
    "num_digits_in_domain": 0,
    "digit_letter_ratio": 0.0,
    "url_entropy": 4.12,
    "has_suspicious_tld": 0,
    "num_subdomains": 3,
    "has_shortener": 0,
    "special_char_ratio": 0.07,
    "path_entropy": 1.92,
    "has_suspicious_keywords": 1
  },
  "shap_explanations": [
    { "feature": "has_suspicious_keywords", "contribution": 0.28, "description": "Contains suspicious financial/security keyword (paypal, login, verification)" },
    { "feature": "has_https", "contribution": 0.22, "description": "Lacks SSL/TLS encryption (HTTP protocol)" }
  ],
  "model_predictions": {
    "logistic_regression": { "probability": 0.96, "prediction": 1 },
    "decision_tree": { "probability": 1.0, "prediction": 1 },
    "random_forest": { "probability": 0.94, "prediction": 1 },
    "gradient_boosting": { "probability": 0.89, "prediction": 1 }
  },
  "top_reasons": [
    "URL contains suspicious keywords associated with phishing campaigns.",
    "URL lacks HTTP Secure (HTTPS) encryption.",
    "Excessive domain length and subdomain structure detected."
  ],
  "best_model_name": "random_forest"
}
```

- **Error Responses**:
  - `400 Bad Request`: Malformed URL, missing scheme, invalid host, or forbidden internal IP target.
```json
{
  "detail": "Invalid URL: Host cannot be localhost or private IP address"
}
```
  - `503 Service Unavailable`: ML models have not been trained/loaded.

---

### 3. Scan History & Reports

#### `GET /api/history`
Retrieve paginated scan records with optional filtering.

- **Query Parameters:**
  - `skip` (int, default: 0): Offset
  - `limit` (int, default: 50, max: 200): Record count limit
  - `verdict` (string, optional): Filter by `Safe`, `Suspicious`, or `Phishing`
  - `search` (string, optional): Search keyword within URL

- **Response `200 OK`**:
```json
{
  "total": 42,
  "skip": 0,
  "limit": 50,
  "scans": [
    {
      "id": 14,
      "url": "http://paypal-security-update.account-verification-login.com/auth",
      "risk_score": 88,
      "verdict": "Phishing",
      "confidence": 0.94,
      "created_at": "2026-09-11T14:30:00.000000"
    }
  ]
}
```

#### `GET /api/report/{scan_id}`
Lookup complete scan result by ID.

- **Response `200 OK`**: Full scan response (same schema as `POST /api/scan`).
- **Response `404 Not Found`**:
```json
{ "detail": "Scan not found" }
```

#### `DELETE /api/history/{scan_id}`
Delete a single scan record.

- **Response `200 OK`**:
```json
{ "message": "Scan deleted successfully" }
```

---

### 4. Analytics & Model Comparison

#### `GET /api/analytics`
Calculates cumulative dashboard metrics from scan history.

- **Response `200 OK`**:
```json
{
  "total_scans": 150,
  "phishing_count": 45,
  "suspicious_count": 15,
  "safe_count": 90,
  "average_risk_score": 34.2,
  "threat_percentage": 40.0,
  "recent_scans": [...],
  "risk_distribution": {
    "0-20": 80,
    "21-40": 10,
    "41-60": 15,
    "61-80": 20,
    "81-100": 25
  },
  "daily_scans": [
    { "date": "2026-09-10", "count": 12 },
    { "date": "2026-09-11", "count": 18 }
  ]
}
```

#### `GET /api/models/compare`
Retrieves evaluation metrics (Holdout & 5-Fold Stratified CV) and feature importance rankings.

- **Response `200 OK`**:
```json
{
  "dataset_mode": "synthetic",
  "metadata": {
    "dataset_samples": 1200,
    "features_count": 22,
    "trained_at": "2026-09-11T10:00:00"
  },
  "models": {
    "logistic_regression": { "accuracy": 1.0, "precision": 1.0, "recall": 1.0, "f1": 1.0, "roc_auc": 1.0 },
    "decision_tree": { "accuracy": 0.85, "precision": 0.8043, "recall": 0.925, "f1": 0.8605, "roc_auc": 0.85 },
    "random_forest": { "accuracy": 1.0, "precision": 1.0, "recall": 1.0, "f1": 1.0, "roc_auc": 1.0 },
    "gradient_boosting": { "accuracy": 0.85, "precision": 0.8043, "recall": 0.925, "f1": 0.8605, "roc_auc": 0.8868 }
  },
  "feature_importances": {
    "random_forest": { "url_entropy": 0.18, "url_length": 0.14, "has_suspicious_keywords": 0.12, ... }
  }
}
```
