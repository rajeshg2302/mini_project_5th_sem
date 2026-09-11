"""
PhishGuard Application Configuration
"""

import os

# Base directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECT_DIR = os.path.dirname(BASE_DIR)

# Database
DATABASE_DIR = os.path.join(PROJECT_DIR, 'database')
os.makedirs(DATABASE_DIR, exist_ok=True)
DATABASE_URL = f"sqlite:///{os.path.join(DATABASE_DIR, 'phishguard.db')}"

# ML Models directory (check root models/ first, then ml/models/)
ML_MODELS_DIR = os.path.join(PROJECT_DIR, 'models')
if not os.path.exists(ML_MODELS_DIR):
    ML_MODELS_DIR = os.path.join(PROJECT_DIR, 'ml', 'models')

# CORS Origins (React dev server)
CORS_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:3000",
    "*",
]

# ─── Phase 2 Verified Models ─────────────────────────────────────────────
# Only the four models that passed Phase 2 verification.
# Each entry: display_key -> (filename, use_scaled_features)
# "xgboost.joblib" is intentionally excluded — it is a GradientBoostingClassifier
# that was mislabeled during an earlier training run; gradient_boosting.joblib
# is the clean, Phase-2-verified artifact.
VERIFIED_MODEL_FILES = {
    "logistic_regression": ("logistic_regression.joblib", True),
    "decision_tree":       ("decision_tree.joblib",        False),
    "random_forest":       ("random_forest.joblib",        False),
    "gradient_boosting":   ("gradient_boosting.joblib",    False),
}

# Ensemble weights for the four verified models
MODEL_WEIGHTS = {
    "random_forest":      0.35,
    "gradient_boosting":  0.30,
    "logistic_regression": 0.20,
    "decision_tree":      0.15,
}

# Risk score 5-tier boundary levels (Phase 5)
# 0-20 LOW, 21-40 GUARDED, 41-60 MEDIUM, 61-80 HIGH, 81-100 CRITICAL
RISK_BOUNDARIES = {
    "LOW":      (0, 20),
    "GUARDED":  (21, 40),
    "MEDIUM":   (41, 60),
    "HIGH":     (61, 80),
    "CRITICAL": (81, 100),
}

def get_risk_level(score: int) -> str:
    """Return 5-tier risk level string for a given score (clamped 0-100)."""
    clamped = max(0, min(100, int(score)))
    if clamped <= 20:
        return "LOW"
    elif clamped <= 40:
        return "GUARDED"
    elif clamped <= 60:
        return "MEDIUM"
    elif clamped <= 80:
        return "HIGH"
    else:
        return "CRITICAL"

RISK_THRESHOLDS = {
    "safe":       30,
    "suspicious": 70,
}

