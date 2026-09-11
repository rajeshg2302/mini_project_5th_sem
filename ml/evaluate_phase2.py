"""
PhishGuard ML Pipeline — Model Evaluator & Metadata Manager

Computes evaluation metrics & 5-fold Stratified Cross-Validation for the
4 verified Phase-2 models against the dataset (determined by DATASET_MODE).

Saves:
  - models/evaluation_results.json
  - models/feature_importances.json
  - models/metadata.json
"""

import os
import sys
import json
import datetime
import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_validate
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix
)

# Ensure backend feature names can be imported
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)
backend_path = os.path.join(PROJECT_ROOT, "backend")
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from ml.config import DATASET_PATH, ACTIVE_DATASET_MODE, RANDOM_SEED, MODELS_DIR
from app.services.feature_extractor import FEATURE_NAMES

# ── Load active dataset ──────────────────────────────────────────────────
if not os.path.exists(DATASET_PATH):
    raise FileNotFoundError(f"Dataset path not found: {DATASET_PATH}")

df = pd.read_csv(DATASET_PATH)
print(f"Loaded dataset ({ACTIVE_DATASET_MODE} mode): {len(df)} rows")

X = df[FEATURE_NAMES].values
y = df["label"].values

# 80/20 Stratified Split to prevent data leakage
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=RANDOM_SEED, stratify=y
)

# Load scaler
scaler_path = os.path.join(MODELS_DIR, "scaler.joblib")
scaler = joblib.load(scaler_path) if os.path.exists(scaler_path) else None
X_train_scaled = scaler.transform(X_train) if scaler else X_train
X_test_scaled = scaler.transform(X_test) if scaler else X_test

# ── Verified Phase 2 models ───────────────────────────────────────────────
VERIFIED_MODELS = {
    "logistic_regression":  ("logistic_regression.joblib",  True),
    "decision_tree":        ("decision_tree.joblib",         False),
    "random_forest":        ("random_forest.joblib",         False),
    "gradient_boosting":    ("gradient_boosting.joblib",     False),
}

results = {}
importances = {}
cv_results = {}

skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_SEED)

for key, (filename, use_scaled) in VERIFIED_MODELS.items():
    path = os.path.join(MODELS_DIR, filename)
    if not os.path.exists(path):
        print(f"  SKIP {key}: file not found ({filename})")
        continue

    model = joblib.load(path)
    X_in_test = X_test_scaled if use_scaled else X_test
    X_in_train = X_train_scaled if use_scaled else X_train

    try:
        # Holdout metrics
        y_pred = model.predict(X_in_test)
        if hasattr(model, "predict_proba"):
            y_proba = model.predict_proba(X_in_test)[:, 1]
        else:
            y_proba = y_pred.astype(float)

        acc   = float(accuracy_score(y_test, y_pred))
        prec  = float(precision_score(y_test, y_pred, zero_division=0))
        rec   = float(recall_score(y_test, y_pred, zero_division=0))
        f1    = float(f1_score(y_test, y_pred, zero_division=0))
        auc   = float(roc_auc_score(y_test, y_proba))
        cm    = confusion_matrix(y_test, y_pred).tolist()

        # 5-Fold Stratified Cross Validation
        cv_scores = cross_validate(
            model, X_in_train, y_train, cv=skf,
            scoring=["accuracy", "precision", "recall", "f1"]
        )

        cv_summary = {
            "cv_accuracy_mean": float(round(np.mean(cv_scores["test_accuracy"]), 4)),
            "cv_accuracy_std":  float(round(np.std(cv_scores["test_accuracy"]), 4)),
            "cv_precision_mean": float(round(np.mean(cv_scores["test_precision"]), 4)),
            "cv_recall_mean":    float(round(np.mean(cv_scores["test_recall"]), 4)),
            "cv_f1_mean":        float(round(np.mean(cv_scores["test_f1"]), 4)),
        }

        results[key] = {
            "accuracy":         round(acc, 4),
            "precision":        round(prec, 4),
            "recall":           round(rec, 4),
            "f1_score":         round(f1, 4),
            "auc_roc":          round(auc, 4),
            "confusion_matrix": cm,
            "cross_validation": cv_summary,
        }
        print(f"  {key}: acc={acc:.4f} f1={f1:.4f} auc={auc:.4f} (5-fold CV F1={cv_summary['cv_f1_mean']:.4f})")

    except Exception as e:
        print(f"  ERROR evaluating {key}: {e}")
        continue

    # Feature importances
    if hasattr(model, "feature_importances_"):
        imp = model.feature_importances_
        feat_imp = {FEATURE_NAMES[i]: round(float(imp[i]), 4) for i in range(len(FEATURE_NAMES))}
        feat_imp = dict(sorted(feat_imp.items(), key=lambda x: x[1], reverse=True))
        importances[key] = feat_imp
    elif hasattr(model, "coef_"):
        coefs = model.coef_[0]
        feat_imp = {FEATURE_NAMES[i]: round(float(abs(coefs[i])), 4) for i in range(len(FEATURE_NAMES))}
        feat_imp = dict(sorted(feat_imp.items(), key=lambda x: x[1], reverse=True))
        importances[key] = feat_imp

# ── Save Evaluation Results ───────────────────────────────────────────
eval_path = os.path.join(MODELS_DIR, "evaluation_results.json")
with open(eval_path, "w") as f:
    json.dump(results, f, indent=2)

imp_path = os.path.join(MODELS_DIR, "feature_importances.json")
with open(imp_path, "w") as f:
    json.dump(importances, f, indent=2)

# ── Save Model Metadata & Versioning ──────────────────────────────────
metadata = {
    "version": "1.0.0-phase5",
    "dataset_mode": ACTIVE_DATASET_MODE,
    "dataset_path": DATASET_PATH,
    "total_samples": len(df),
    "feature_count": len(FEATURE_NAMES),
    "feature_version": "22_canonical_url_features",
    "random_seed": RANDOM_SEED,
    "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "verified_models": list(results.keys()),
    "best_model_name": "logistic_regression",
    "evaluation_summary": results,
}

meta_path = os.path.join(MODELS_DIR, "metadata.json")
with open(meta_path, "w") as f:
    json.dump(metadata, f, indent=2)

print(f"\n[+] Saved evaluation metrics to: {eval_path}")
print(f"[+] Saved feature importances to: {imp_path}")
print(f"[+] Saved model metadata to:     {meta_path}")
print("\nDone. Phase 5 model evaluation & versioning complete.")
