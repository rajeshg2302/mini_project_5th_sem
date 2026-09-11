# PhishGuard REST API Specification

Base API URL: `http://localhost:8000/api`

## Endpoints

### 1. Health & Status
- **`GET /health`** (Root server level)
  - **Response:** `{ "status": "healthy", "models_loaded": true }`
- **`GET /api/status`**
  - **Response:** Predictor status, loaded model list, scaler status, and active model count.

### 2. URL Scanner
- **`POST /api/scan`**
  - **Body:** `{ "url": "https://example.com" }`
  - **Response:**
    ```json
    {
      "id": 1,
      "url": "https://example.com",
      "risk_score": 12,
      "risk_level": "LOW",
      "verdict": "Safe",
      "confidence": 0.88,
      "phishing_probability": 0.12,
      "features": { ... },
      "shap_explanations": [ ... ],
      "model_predictions": [ ... ],
      "top_reasons": [ "✅ HTTPS is enabled" ],
      "best_model_name": "logistic_regression",
      "created_at": "2026-09-11T10:30:00.000Z"
    }
    ```

### 3. Scan History & Reports
- **`GET /api/history`**
  - **Query Params:** `skip` (default 0), `limit` (default 50), `search`, `verdict`
  - **Response:** Paginated list of historical scan records.
- **`GET /api/report/{scan_id}`**
  - **Response:** Complete security report object for specific scan record ID.
- **`DELETE /api/history/{scan_id}`**
  - **Response:** `{ "message": "Scan deleted successfully" }`

### 4. Threat Analytics & Model Lab
- **`GET /api/analytics`**
  - **Response:** Total scans, phishing/suspicious/safe counts, average risk score, threat percentage, risk distribution, daily scan trend.
- **`GET /api/models/compare`**
  - **Response:** `dataset_mode`, `metadata`, accuracy, precision, recall, f1_score, auc_roc, 5-fold CV metrics, confusion matrices, feature importances.
- **`GET /api/models/feature-importance`**
  - **Response:** Feature importance weights per model.
