# PhishGuard Architecture

## System Overview

PhishGuard is built as a multi-tier, modular AI cybersecurity platform for URL phishing detection and explainable threat analysis.

```
┌─────────────────────────────────────────────────────────┐
│                    REACT 18 FRONTEND                    │
│   (Vite, Recharts, Framer Motion, Axios, Tailwind CSS)   │
└────────────────────────────┬────────────────────────────┘
                             │ REST API (JSON)
                             ▼
┌─────────────────────────────────────────────────────────┐
│                    FASTAPI BACKEND                      │
│   - URL Validator & Sanitizer (Zero-Network SSRF Safe)  │
│   - 22-Feature Extractor Engine                         │
│   - ML Inference Predictor (Singleton Model Registry)   │
│   - SHAP-Inspired Feature Explainer Matrix               │
│   - SQLAlchemy ORM & SQLite Persistence                 │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│                    ML MODEL REGISTRY                    │
│   - Logistic Regression  (logistic_regression.joblib)   │
│   - Decision Tree        (decision_tree.joblib)         │
│   - Random Forest        (random_forest.joblib)         │
│   - Gradient Boosting    (gradient_boosting.joblib)     │
│   - Metadata Registry    (metadata.json)                │
└─────────────────────────────────────────────────────────┘
```

## Component Architecture

1. **Frontend UI Layer (`phishguard/frontend`):**
   - Built with React 18 and Vite.
   - Communicates with the FastAPI backend via centralized `services/api.js`.
   - Displays real-time scan sequences, 5-tier risk boundaries (`LOW`, `GUARDED`, `MEDIUM`, `HIGH`, `CRITICAL`), model confidence bars, and interactive 22-feature inspection.

2. **Backend API Layer (`phishguard/backend`):**
   - Built with FastAPI and Uvicorn.
   - Implements URL scheme validation and zero-network isolation (no HTTP requests are dispatched to scanned targets).
   - Manages SQLite transactions (`database/phishguard.db`).

3. **Machine Learning Core (`phishguard/ml`):**
   - Modular training, dataset quality validation, and cross-validation scripts (`ml/train.py`, `ml/dataset_validator.py`, `ml/evaluate_phase2.py`).
   - Uses `joblib` artifact serialization and 5-fold Stratified K-Fold cross validation.
