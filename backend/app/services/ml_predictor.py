"""
PhishGuard ML Prediction Engine
Loads Phase-2-verified trained models and runs predictions on extracted features.

Verified models (Phase 2):
  - Logistic Regression (logistic_regression.joblib)
  - Decision Tree       (decision_tree.joblib)
  - Random Forest       (random_forest.joblib)
  - Gradient Boosting   (gradient_boosting.joblib)

Note: xgboost.joblib is intentionally NOT loaded — it is a mislabeled
GradientBoostingClassifier artifact from an earlier training run and was NOT
part of the Phase 2 verification set.
"""

import os
import json
import numpy as np
import joblib
from typing import Dict, List, Optional

from ..config import ML_MODELS_DIR, MODEL_WEIGHTS, RISK_THRESHOLDS, VERIFIED_MODEL_FILES
from .feature_extractor import FEATURE_NAMES


class MLPredictor:
    """Loads and manages Phase-2-verified ML models for phishing prediction."""

    def __init__(self):
        self.models: Dict[str, object] = {}
        self.scaler = None
        self.feature_names = FEATURE_NAMES
        self.evaluation_results: Dict = {}
        self.feature_importances: Dict = {}
        self.best_model_name: Optional[str] = None
        self._loaded = False

    def load_models(self) -> bool:
        """Load verified Phase-2 models, scaler, and metadata from disk."""
        if not os.path.exists(ML_MODELS_DIR):
            print(f"WARNING: Models directory not found at {ML_MODELS_DIR}")
            print("Run the training pipeline first: python ml/train.py")
            return False

        try:
            # Load scaler
            scaler_path = os.path.join(ML_MODELS_DIR, 'scaler.joblib')
            if os.path.exists(scaler_path):
                self.scaler = joblib.load(scaler_path)
                print("  Loaded scaler")

            # Load each verified Phase 2 model
            for key, (filename, _use_scaled) in VERIFIED_MODEL_FILES.items():
                model_path = os.path.join(ML_MODELS_DIR, filename)
                if os.path.exists(model_path):
                    try:
                        self.models[key] = joblib.load(model_path)
                        print(f"  Loaded model: {key}  ({filename})")
                    except Exception as e:
                        print(f"  WARNING: Could not load {key} ({filename}): {e}")
                else:
                    print(f"  WARNING: Model file not found: {filename}")

            # Identify best_model (used for labelling purposes only, not re-prediction)
            best_path = os.path.join(ML_MODELS_DIR, 'best_model.joblib')
            if os.path.exists(best_path):
                try:
                    best = joblib.load(best_path)
                    best_type = type(best).__name__
                    # Map sklearn class name → our display key
                    _type_to_key = {
                        'LogisticRegression':       'logistic_regression',
                        'DecisionTreeClassifier':   'decision_tree',
                        'RandomForestClassifier':   'random_forest',
                        'GradientBoostingClassifier': 'gradient_boosting',
                    }
                    self.best_model_name = _type_to_key.get(best_type, best_type)
                    print(f"  Best model: {self.best_model_name} ({best_type})")
                except Exception as e:
                    print(f"  WARNING: Could not identify best model: {e}")

            # Load evaluation results
            eval_path = os.path.join(ML_MODELS_DIR, 'evaluation_results.json')
            if os.path.exists(eval_path):
                with open(eval_path, 'r') as f:
                    self.evaluation_results = json.load(f)

            # Load feature importances
            imp_path = os.path.join(ML_MODELS_DIR, 'feature_importances.json')
            if os.path.exists(imp_path):
                with open(imp_path, 'r') as f:
                    self.feature_importances = json.load(f)

            self._loaded = len(self.models) > 0
            if self._loaded:
                print(f"  ML Predictor ready with {len(self.models)} model(s): "
                      f"{list(self.models.keys())}")
            return self._loaded

        except Exception as e:
            print(f"ERROR loading models: {e}")
            return False

    @property
    def is_loaded(self) -> bool:
        return self._loaded

    def predict(self, features: Dict[str, float]) -> Dict:
        """
        Run prediction on extracted features using all verified Phase-2 models.

        Returns dict with:
          - risk_score (0–100)
          - verdict    ('Safe' | 'Suspicious' | 'Phishing')
          - confidence (0.0–1.0)
          - ensemble_probability (0.0–1.0)
          - model_predictions   (list of per-model dicts)
          - best_model_name     (str)
        """
        if not self._loaded:
            raise RuntimeError("Models not loaded. Run training pipeline first.")

        # Convert feature dict to ordered numpy array
        feature_vector = np.array([[features[name] for name in FEATURE_NAMES]])

        # Scale for logistic regression
        feature_vector_scaled = (
            self.scaler.transform(feature_vector) if self.scaler is not None
            else feature_vector
        )

        model_predictions: List[Dict] = []
        weighted_proba_sum = 0.0
        total_weight = 0.0

        for key, model in self.models.items():
            # Determine correct input (scaled vs raw) based on VERIFIED_MODEL_FILES
            use_scaled = VERIFIED_MODEL_FILES.get(key, (None, False))[1]
            X = feature_vector_scaled if use_scaled else feature_vector

            weight = MODEL_WEIGHTS.get(key, 0.1)

            try:
                prediction = int(model.predict(X)[0])
                probabilities = model.predict_proba(X)[0]
                phishing_prob = float(probabilities[1])
                confidence = float(max(probabilities))
            except Exception as e:
                print(f"WARNING: Prediction failed for {key}: {e}")
                continue

            model_predictions.append({
                'model_name': key.replace('_', ' ').title(),
                'prediction': prediction,
                'probability': round(phishing_prob, 4),
                'confidence': round(confidence, 4),
            })

            weighted_proba_sum += phishing_prob * weight
            total_weight += weight

        # Weighted ensemble risk score
        ensemble_probability = (
            weighted_proba_sum / total_weight if total_weight > 0 else 0.5
        )
        risk_score = max(0, min(100, round(ensemble_probability * 100)))

        # Verdict
        if risk_score <= RISK_THRESHOLDS['safe']:
            verdict = 'Safe'
        elif risk_score <= RISK_THRESHOLDS['suspicious']:
            verdict = 'Suspicious'
        else:
            verdict = 'Phishing'

        # Overall confidence: distance from 0.5, mapped to [0.5, 1.0]
        confidence = round(
            max(ensemble_probability, 1.0 - ensemble_probability), 4
        )

        from ..config import get_risk_level
        risk_level = get_risk_level(risk_score)

        return {
            'risk_score': risk_score,
            'risk_level': risk_level,
            'verdict': verdict,
            'confidence': confidence,
            'ensemble_probability': round(ensemble_probability, 4),
            'model_predictions': model_predictions,
            'best_model_name': self.best_model_name,
        }

    def get_evaluation_results(self) -> Dict:
        """Return saved evaluation metrics for all Phase-2 verified models."""
        return self.evaluation_results

    def get_feature_importances(self) -> Dict:
        """Return saved feature importances for all Phase-2 verified models."""
        return self.feature_importances

    def get_status(self) -> Dict:
        """Return predictor status summary."""
        return {
            "loaded": self._loaded,
            "models_loaded": list(self.models.keys()),
            "model_count": len(self.models),
            "best_model": self.best_model_name,
            "scaler_loaded": self.scaler is not None,
            "models_dir": ML_MODELS_DIR,
        }


# Singleton instance
predictor = MLPredictor()
