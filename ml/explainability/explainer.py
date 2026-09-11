"""
PhishGuard ML Pipeline — Explainability Module

Provides local prediction explanations for any URL feature vector using SHAP
(SHapley Additive exPlanations) or fallback feature attribution if SHAP
is not installed or unsupported for a given model.
"""

import numpy as np
from typing import Dict, List, Any, Union
from ml.config import FEATURE_NAMES

try:
    import shap
    SHAP_AVAILABLE = True
except ImportError:
    SHAP_AVAILABLE = False


class PredictionExplainer:
    """
    Computes per-feature contributions and generates human-readable
    explanations for machine learning predictions.
    """

    def __init__(self, model, feature_names: List[str] = FEATURE_NAMES):
        self.model = model
        self.feature_names = feature_names
        self.explainer = None
        self._init_explainer()

    def _init_explainer(self):
        """Initialize SHAP explainer if available."""
        if not SHAP_AVAILABLE:
            return

        try:
            # TreeExplainer for tree models (RandomForest, DecisionTree, GradientBoosting)
            if hasattr(self.model, "tree_"):
                self.explainer = shap.TreeExplainer(self.model)
            elif hasattr(self.model, "estimators_"):
                self.explainer = shap.TreeExplainer(self.model)
            elif hasattr(self.model, "coef_"):
                # LinearExplainer or KernelExplainer for LogisticRegression
                self.explainer = None  # Fallback to linear weight attribution
        except Exception:
            self.explainer = None

    def explain(self, feature_vector: np.ndarray, feature_dict: Dict[str, float] = None) -> Dict[str, Any]:
        """
        Explain a single feature vector prediction.

        Parameters
        ----------
        feature_vector : np.ndarray
            Shape (1, num_features) or (num_features,)
        feature_dict : dict, optional
            Extracted feature name-value pairs for context.

        Returns
        -------
        dict
            Contains SHAP/attribution values, top features pushing toward phishing/legitimate,
            and human-readable reason text.
        """
        if feature_vector.ndim == 1:
            feature_vector = feature_vector.reshape(1, -1)

        attributions = {}

        # Strategy 1: SHAP TreeExplainer
        if self.explainer is not None:
            try:
                shap_vals = self.explainer.shap_values(feature_vector)
                # Handle binary classification output shapes (list of arrays or 2D/3D array)
                if isinstance(shap_vals, list):
                    vals = shap_vals[1][0] if len(shap_vals) > 1 else shap_vals[0][0]
                elif shap_vals.ndim == 3:
                    vals = shap_vals[0, :, 1]
                else:
                    vals = shap_vals[0]

                for name, val in zip(self.feature_names, vals):
                    attributions[name] = float(val)
            except Exception:
                attributions = self._fallback_attribution(feature_vector[0])
        else:
            attributions = self._fallback_attribution(feature_vector[0])

        # Sort features by absolute contribution magnitude
        sorted_features = sorted(
            attributions.items(), key=lambda item: abs(item[1]), reverse=True
        )

        top_phishing_factors = [
            {"feature": k, "contribution": round(v, 4), "value": feature_dict.get(k) if feature_dict else None}
            for k, v in sorted_features if v > 0
        ]
        top_legitimate_factors = [
            {"feature": k, "contribution": round(v, 4), "value": feature_dict.get(k) if feature_dict else None}
            for k, v in sorted_features if v < 0
        ]

        # Generate human-readable summary strings
        reasons = self._generate_reasons(sorted_features[:5], feature_dict)

        return {
            "attributions": {k: round(v, 4) for k, v in attributions.items()},
            "top_features": [
                {"feature": k, "impact": round(v, 4)} for k, v in sorted_features[:7]
            ],
            "phishing_indicators": top_phishing_factors[:5],
            "safety_indicators": top_legitimate_factors[:5],
            "reasons": reasons,
        }

    def _fallback_attribution(self, features: np.ndarray) -> Dict[str, float]:
        """
        Calculates feature attributions based on model coefficients or feature importances
        when SHAP is unavailable.
        """
        attributions = {}
        if hasattr(self.model, "feature_importances_"):
            importances = self.model.feature_importances_
            # Direction inferred from feature value compared to average scale
            for i, name in enumerate(self.feature_names):
                val = features[i]
                # High values for risk features add positive attribution
                direction = 1.0 if val > 0 else -0.5
                attributions[name] = float(importances[i] * direction)
        elif hasattr(self.model, "coef_"):
            coefs = self.model.coef_[0]
            for i, name in enumerate(self.feature_names):
                attributions[name] = float(coefs[i] * features[i])
        else:
            for name in self.feature_names:
                attributions[name] = 0.0

        return attributions

    def _generate_reasons(self, top_features: List[tuple], feature_dict: Dict[str, float] = None) -> List[str]:
        """Generate human-understandable explanation strings."""
        reasons = []
        feature_map = {
            "url_length": "Abnormally long URL length",
            "hostname_length": "Suspiciously long hostname",
            "path_length": "Excessive path depth",
            "num_dots": "Multiple subdomains / dots in URL",
            "num_hyphens": "Excessive hyphenation in domain",
            "num_slashes": "High directory path slash count",
            "num_subdomains": "High number of subdomains",
            "has_at_symbol": "Contains '@' symbol (masked destination)",
            "has_ip_address": "Uses raw IP address instead of domain name",
            "is_https": "Does not use secure HTTPS protocol",
            "suspicious_keyword_count": "Contains phishing-associated keywords (e.g. login, verify, bank)",
            "is_shortened_url": "Uses known URL shortening service",
            "special_char_count": "High concentration of special characters",
            "num_query_params": "Multiple suspicious query parameters",
            "has_fragment": "Contains anchor URL fragment",
            "hostname_entropy": "High character entropy (randomized hostname)",
        }

        for feature_name, contribution in top_features:
            desc = feature_map.get(feature_name, feature_name.replace("_", " ").title())
            direction = "increased risk score" if contribution > 0 else "reduced risk score"
            val_str = ""
            if feature_dict and feature_name in feature_dict:
                val_str = f" (value: {feature_dict[feature_name]})"
            reasons.append(f"{desc}{val_str} — {direction}.")

        return reasons
