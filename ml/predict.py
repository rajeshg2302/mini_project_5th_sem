"""
PhishGuard ML Pipeline — Inference & Prediction Module

Provides real-time URL prediction using loaded ML models:
1. Feature extraction from raw URL
2. Model probability prediction (Random Forest, Decision Tree, Gradient Boosting, Logistic Regression)
3. Risk score calculation (0–100 scale)
4. Classification: Safe (0-30), Suspicious (31-70), Phishing (71-100)
5. Explainability analysis via PredictionExplainer
"""

import os
import joblib
import numpy as np
from typing import Dict, Any, List, Union

from ml.config import MODELS_DIR, FEATURE_NAMES
from ml.features.url_features import extract_features, extract_features_vector
from ml.explainability.explainer import PredictionExplainer


class PhishGuardPredictor:
    """
    Inference engine for classifying URLs and generating explainable security assessments.
    """

    def __init__(self, models_dir: str = MODELS_DIR):
        self.models_dir = models_dir
        self.models = {}
        self.scaler = None
        self.explainers = {}
        self.best_model_name = "random_forest"
        self._load_artifacts()

    def _load_artifacts(self):
        """Load trained model joblib files, scaler, and initialize explainers."""
        if not os.path.exists(self.models_dir):
            raise FileNotFoundError(
                f"Models directory not found at {self.models_dir}. Please run training first."
            )

        # Load scaler if exists
        scaler_path = os.path.join(self.models_dir, "scaler.joblib")
        if os.path.exists(scaler_path):
            self.scaler = joblib.load(scaler_path)

        # Load Phase-2 verified models ONLY.
        # xgboost.joblib is intentionally excluded — it is a mislabeled
        # GradientBoostingClassifier artifact; gradient_boosting.joblib is the
        # clean Phase-2-verified file.
        model_names = ["logistic_regression", "decision_tree", "random_forest", "gradient_boosting"]
        for name in model_names:
            model_path = os.path.join(self.models_dir, f"{name}.joblib")
            if os.path.exists(model_path):
                try:
                    model = joblib.load(model_path)
                    self.models[name] = model
                    self.explainers[name] = PredictionExplainer(model, FEATURE_NAMES)
                except Exception as e:
                    print(f"Warning: Could not load model '{name}': {e}")

        # Resolve best_model_name from best_model.joblib's actual class type
        best_path = os.path.join(self.models_dir, "best_model.joblib")
        if os.path.exists(best_path):
            try:
                best_model = joblib.load(best_path)
                _type_map = {
                    "LogisticRegression":         "logistic_regression",
                    "DecisionTreeClassifier":     "decision_tree",
                    "RandomForestClassifier":     "random_forest",
                    "GradientBoostingClassifier": "gradient_boosting",
                }
                self.best_model_name = _type_map.get(
                    type(best_model).__name__, type(best_model).__name__
                )
            except Exception:
                pass

        if not self.models:
            raise RuntimeError(
                f"No verified model joblib files found in {self.models_dir}. Train models before making predictions."
            )

    def predict_url(self, url: str, primary_model: str = "random_forest") -> Dict[str, Any]:
        """
        Extract features from URL, run inference across models, compute risk score and explanation.

        Parameters
        ----------
        url : str
            Target URL string.
        primary_model : str
            The primary model to use for SHAP explanations (default: 'random_forest').

        Returns
        -------
        dict
            Scan results including verdict, risk score, probability, per-model predictions,
            extracted features, and SHAP explanation.
        """
        # 1. Feature extraction
        feat_dict = extract_features(url)
        vector = np.array(extract_features_vector(url), dtype=np.float64)
        X = vector.reshape(1, -1)

        # Scaled vector for Logistic Regression
        X_scaled = self.scaler.transform(X) if self.scaler is not None else X

        model_predictions = {}
        probabilities = []

        # 2. Run prediction on all loaded models
        for name, model in self.models.items():
            if name == "best":
                continue

            X_in = X_scaled if name == "logistic_regression" else X
            try:
                if hasattr(model, "predict_proba"):
                    proba = float(model.predict_proba(X_in)[0, 1])
                elif hasattr(model, "decision_function"):
                    val = float(model.decision_function(X_in)[0])
                    proba = 1.0 / (1.0 + np.exp(-val))
                else:
                    proba = float(model.predict(X_in)[0])

                pred_label = 1 if proba >= 0.5 else 0
                model_predictions[name] = {
                    "phishing_probability": round(proba, 4),
                    "verdict": "Phishing" if pred_label == 1 else "Legitimate",
                    "confidence": round(proba if pred_label == 1 else (1.0 - proba), 4)
                }
                probabilities.append(proba)
            except Exception as e:
                print(f"Error predicting with {name}: {e}")

        # Ensemble average probability
        avg_proba = float(np.mean(probabilities)) if probabilities else 0.5
        risk_score = int(round(avg_proba * 100))

        # Classification rules
        if risk_score <= 30:
            verdict = "Safe"
        elif risk_score <= 70:
            verdict = "Suspicious"
        else:
            verdict = "Phishing"

        confidence = round(avg_proba if avg_proba >= 0.5 else (1.0 - avg_proba), 4)

        # 3. Explainability
        explainer_key = primary_model if primary_model in self.explainers else list(self.explainers.keys())[0]
        explainer = self.explainers[explainer_key]
        X_exp = X_scaled if explainer_key == "logistic_regression" else X
        explanation = explainer.explain(X_exp[0], feat_dict)

        return {
            "url": url,
            "verdict": verdict,
            "risk_score": risk_score,
            "phishing_probability": round(avg_proba, 4),
            "confidence": confidence,
            "extracted_features": feat_dict,
            "model_predictions": model_predictions,
            "explanation": explanation,
        }
