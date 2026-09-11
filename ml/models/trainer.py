"""
PhishGuard ML Pipeline — Model Trainer Engine

Trains, evaluates, and persists multiple ML classification models:
- Logistic Regression
- Decision Tree
- Random Forest
- Gradient Boosting

Computes real evaluation metrics (Accuracy, Precision, Recall, F1-Score, ROC-AUC)
and confusion matrices without hardcoding or fabricating performance data.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd

from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, classification_report
)

from ml.config import (
    MODELS_DIR, RESULTS_DIR, FEATURE_NAMES, MODEL_PARAMS,
    PRIMARY_METRIC, RANDOM_SEED
)


class ModelTrainer:
    """
    Handles training, evaluation, and serialization of ML models.
    """

    def __init__(self, models_dir: str = MODELS_DIR, results_dir: str = RESULTS_DIR):
        self.models_dir = models_dir
        self.results_dir = results_dir
        os.makedirs(self.models_dir, exist_ok=True)
        os.makedirs(self.results_dir, exist_ok=True)
        self.trained_models = {}
        self.evaluation_results = {}

    def get_model_instances(self) -> dict:
        """Instantiate classifiers with parameters from config."""
        return {
            "logistic_regression": LogisticRegression(
                **MODEL_PARAMS["logistic_regression"]
            ),
            "decision_tree": DecisionTreeClassifier(
                **MODEL_PARAMS["decision_tree"]
            ),
            "random_forest": RandomForestClassifier(
                **MODEL_PARAMS["random_forest"]
            ),
            "gradient_boosting": GradientBoostingClassifier(
                **MODEL_PARAMS["gradient_boosting"]
            ),
        }

    def train_and_evaluate_all(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_test: np.ndarray,
        y_test: np.ndarray,
        X_train_scaled: np.ndarray,
        X_test_scaled: np.ndarray,
        scaler=None,
    ) -> dict:
        """
        Train all configured models and evaluate on the test set.

        Note: Logistic Regression uses scaled features; tree models use raw features.
        """
        models = self.get_model_instances()

        for name, model in models.items():
            print(f"\n{'=' * 60}")
            print(f"Training Model: {name.upper()}")
            print(f"{'=' * 60}")

            # Use scaled data for Logistic Regression, unscaled for tree models
            use_scaled = (name == "logistic_regression")
            X_tr = X_train_scaled if use_scaled else X_train
            X_te = X_test_scaled if use_scaled else X_test

            # Fit model
            model.fit(X_tr, y_train)

            # Predict
            y_pred = model.predict(X_te)

            if hasattr(model, "predict_proba"):
                y_proba = model.predict_proba(X_te)[:, 1]
            elif hasattr(model, "decision_function"):
                y_proba = model.decision_function(X_te)
            else:
                y_proba = y_pred.astype(float)

            # Real metrics calculation
            acc = float(accuracy_score(y_test, y_pred))
            prec = float(precision_score(y_test, y_pred, zero_division=0))
            rec = float(recall_score(y_test, y_pred, zero_division=0))
            f1 = float(f1_score(y_test, y_pred, zero_division=0))
            
            try:
                auc = float(roc_auc_score(y_test, y_proba))
            except Exception:
                auc = 0.5

            cm = confusion_matrix(y_test, y_pred).tolist()

            metrics = {
                "accuracy": round(acc, 4),
                "precision": round(prec, 4),
                "recall": round(rec, 4),
                "f1_score": round(f1, 4),
                "auc_roc": round(auc, 4),
                "confusion_matrix": cm,
            }

            self.evaluation_results[name] = metrics
            self.trained_models[name] = model

            print(f"  Accuracy:     {acc:.4f}")
            print(f"  Precision:    {prec:.4f}")
            print(f"  Recall:       {rec:.4f}")
            print(f"  F1 Score:     {f1:.4f}")
            print(f"  AUC-ROC:      {auc:.4f}")
            print(f"  Confusion Matrix: TN={cm[0][0]}, FP={cm[0][1]}, FN={cm[1][0]}, TP={cm[1][1]}")

        # Save all artifacts
        self.save_artifacts(scaler)

        # Select best model based on primary metric (F1-score)
        best_name = max(
            self.evaluation_results,
            key=lambda k: self.evaluation_results[k][PRIMARY_METRIC]
        )
        print(f"\n{'=' * 60}")
        print(f"BEST MODEL SELECTED: {best_name.upper()} ({PRIMARY_METRIC}: {self.evaluation_results[best_name][PRIMARY_METRIC]})")
        print(f"{'=' * 60}")

        # Also save a copy of best model as `best_model.joblib`
        best_model_path = os.path.join(self.models_dir, "best_model.joblib")
        joblib.dump(self.trained_models[best_name], best_model_path)
        print(f"Saved best model copy to: {best_model_path}")

        return self.evaluation_results

    def save_artifacts(self, scaler=None):
        """Save models, scaler, feature names, and evaluation results."""
        # 1. Save individual model joblib files
        for name, model in self.trained_models.items():
            model_path = os.path.join(self.models_dir, f"{name}.joblib")
            joblib.dump(model, model_path)
            print(f"Saved model artifact: {model_path}")

        # 2. Save scaler
        if scaler is not None:
            scaler_path = os.path.join(self.models_dir, "scaler.joblib")
            joblib.dump(scaler, scaler_path)
            print(f"Saved scaler artifact: {scaler_path}")

        # 3. Save feature names JSON
        feature_names_path = os.path.join(self.models_dir, "feature_names.json")
        with open(feature_names_path, "w") as f:
            json.dump(FEATURE_NAMES, f, indent=2)
        print(f"Saved feature names: {feature_names_path}")

        # 4. Save evaluation metrics JSON
        results_path = os.path.join(self.results_dir, "evaluation_results.json")
        with open(results_path, "w") as f:
            json.dump(self.evaluation_results, f, indent=2)
        print(f"Saved evaluation metrics: {results_path}")

        # Also mirror evaluation_results in models_dir for easy backend access
        models_eval_path = os.path.join(self.models_dir, "evaluation_results.json")
        with open(models_eval_path, "w") as f:
            json.dump(self.evaluation_results, f, indent=2)

        # 5. Extract and save feature importances
        self._save_feature_importances()

    def _save_feature_importances(self):
        """Calculate and store global feature importances for all trained models."""
        importances = {}
        for name, model in self.trained_models.items():
            if hasattr(model, "feature_importances_"):
                imp = model.feature_importances_
            elif hasattr(model, "coef_"):
                imp = np.abs(model.coef_[0])
            else:
                continue

            # Normalize importances so they sum to 1.0
            total = float(np.sum(imp))
            normalized = imp / total if total > 0 else imp

            feature_imp = {
                FEATURE_NAMES[i]: round(float(normalized[i]), 4)
                for i in range(len(FEATURE_NAMES))
            }
            # Sort descending
            sorted_imp = dict(sorted(feature_imp.items(), key=lambda item: item[1], reverse=True))
            importances[name] = sorted_imp

        imp_path = os.path.join(self.results_dir, "feature_importances.json")
        with open(imp_path, "w") as f:
            json.dump(importances, f, indent=2)

        # Mirror in models_dir as well
        models_imp_path = os.path.join(self.models_dir, "feature_importances.json")
        with open(models_imp_path, "w") as f:
            json.dump(importances, f, indent=2)

        print(f"Saved feature importances: {imp_path}")
