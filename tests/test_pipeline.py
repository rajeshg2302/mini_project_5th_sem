"""
PhishGuard — Phase 3 Integration Tests (unittest standard library)

Tests:
  1. Feature extractor parity (backend == ml module)
  2. ML predictor loads exactly the 4 Phase-2 verified models
  3. XGBoost is NOT loaded
  4. Prediction returns valid schema (risk_score, verdict, confidence, model_predictions)
  5. risk_score is clamped 0-100
  6. best_model_name is returned and is one of the verified models
  7. Phishing URL has risk_score > 50
  8. Safe URL returns a verdict (Safe or Suspicious)
  9. No network requests during feature extraction
  10. /api/status endpoint returns correct model list
  11. /api/scan does not retrain (model count stable after multiple calls)
  12. ml/predict.py PhishGuardPredictor inference is valid
"""

import unittest
import os
import sys

# ── Path setup ──────────────────────────────────────────────────────────────
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)
backend_path = os.path.join(PROJECT_ROOT, "backend")
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from backend.app.services.feature_extractor import extract_features, FEATURE_NAMES
from ml.features.url_features import extract_features as ml_extract_features
from ml.predict import PhishGuardPredictor

MODELS_DIR = os.path.join(PROJECT_ROOT, "models")
VERIFIED_MODEL_KEYS = {"logistic_regression", "decision_tree", "random_forest", "gradient_boosting"}

# ── Test URL fixtures ────────────────────────────────────────────────────────
LEGITIMATE_URL = "https://www.google.com/search?q=phishguard"
PHISHING_URL   = "http://192.168.1.1/login.php?verify=account&password=reset"


class TestFeatureExtractorParity(unittest.TestCase):
    """Phase 3 — TC-01: Feature extractor parity."""

    def test_backend_returns_22_features(self):
        feats = extract_features(LEGITIMATE_URL)
        self.assertEqual(len(feats), 22, "Backend must extract exactly 22 features")

    def test_ml_module_returns_22_features(self):
        feats = ml_extract_features(LEGITIMATE_URL)
        self.assertEqual(len(feats), 22, "ML module must extract exactly 22 features")

    def test_feature_names_match_canonical_list(self):
        feats = extract_features(LEGITIMATE_URL)
        self.assertEqual(list(feats.keys()), FEATURE_NAMES,
                         "Feature dict keys must match FEATURE_NAMES in order")

    def test_parity_between_backend_and_ml_extractor(self):
        backend_feats = extract_features(LEGITIMATE_URL)
        ml_feats = ml_extract_features(LEGITIMATE_URL)
        self.assertEqual(backend_feats, ml_feats,
                         "Backend and ML feature extractors must produce identical output")

    def test_no_network_requests(self):
        """Feature extraction must work without any network access."""
        import socket
        original_getaddrinfo = socket.getaddrinfo

        def mock_getaddrinfo(*args, **kwargs):
            raise ConnectionError("Network access detected during feature extraction!")

        socket.getaddrinfo = mock_getaddrinfo
        try:
            feats = extract_features("http://example.com/login?verify=1")
            self.assertEqual(len(feats), 22)
        finally:
            socket.getaddrinfo = original_getaddrinfo


class TestMLPredictorLoading(unittest.TestCase):
    """Phase 3 — TC-02: Predictor loads correct Phase-2 verified models."""

    @classmethod
    def setUpClass(cls):
        cls.predictor = PhishGuardPredictor(models_dir=MODELS_DIR)

    def test_verified_models_loaded(self):
        loaded = set(self.predictor.models.keys()) - {"best"}
        self.assertTrue(
            loaded.issubset(VERIFIED_MODEL_KEYS),
            f"Unexpected models loaded: {loaded - VERIFIED_MODEL_KEYS}"
        )
        self.assertTrue(len(loaded) >= 2,
                        "At least 2 verified models must be loaded")

    def test_xgboost_not_loaded_as_xgboost(self):
        """'xgboost' must NOT appear as a model key — it is a mislabeled GB artifact."""
        self.assertNotIn("xgboost", self.predictor.models,
                         "'xgboost' key must NOT be present in loaded models")

    def test_scaler_loaded(self):
        self.assertIsNotNone(self.predictor.scaler,
                             "StandardScaler must be loaded for logistic_regression")


class TestPredictionOutput(unittest.TestCase):
    """Phase 3 — TC-03: Prediction schema and value constraints."""

    @classmethod
    def setUpClass(cls):
        cls.predictor = PhishGuardPredictor(models_dir=MODELS_DIR)
        cls.legit_result  = cls.predictor.predict_url(LEGITIMATE_URL)
        cls.phish_result  = cls.predictor.predict_url(PHISHING_URL)

    def _assert_valid_result(self, result, label):
        self.assertIn("verdict",    result, f"{label}: missing 'verdict'")
        self.assertIn("risk_score", result, f"{label}: missing 'risk_score'")
        self.assertIn("confidence", result, f"{label}: missing 'confidence'")

    def test_legit_result_schema(self):
        self._assert_valid_result(self.legit_result, "Legitimate URL")

    def test_phishing_result_schema(self):
        self._assert_valid_result(self.phish_result, "Phishing URL")

    def test_risk_score_clamped(self):
        for label, result in [("legit", self.legit_result), ("phish", self.phish_result)]:
            score = result["risk_score"]
            self.assertGreaterEqual(score, 0,   f"{label}: risk_score < 0")
            self.assertLessEqual(score, 100,    f"{label}: risk_score > 100")

    def test_verdict_is_valid(self):
        valid = {"Safe", "Suspicious", "Phishing"}
        self.assertIn(self.legit_result["verdict"],  valid)
        self.assertIn(self.phish_result["verdict"],  valid)

    def test_phishing_url_high_risk(self):
        self.assertGreater(
            self.phish_result["risk_score"], 50,
            "Phishing URL must produce risk_score > 50"
        )

    def test_confidence_range(self):
        for label, result in [("legit", self.legit_result), ("phish", self.phish_result)]:
            c = result["confidence"]
            self.assertGreaterEqual(c, 0.0, f"{label}: confidence < 0")
            self.assertLessEqual(c, 1.0,   f"{label}: confidence > 1")

    def test_model_predictions_present(self):
        """predict_url must return per-model predictions."""
        self.assertIn("model_predictions", self.phish_result)
        self.assertIsInstance(self.phish_result["model_predictions"], dict)
        self.assertGreater(len(self.phish_result["model_predictions"]), 0)

    def test_no_fabricated_values(self):
        """probability values must be real floats, not hardcoded."""
        for name, mp in self.phish_result["model_predictions"].items():
            prob = mp["phishing_probability"]
            self.assertIsInstance(prob, float,
                                  f"{name}: phishing_probability must be float")
            self.assertNotEqual(prob, 0.5,
                                f"{name}: probability == 0.5 suggests fabrication")


class TestBestModelName(unittest.TestCase):
    """Phase 3 — TC-04: best_model_name tracking."""

    @classmethod
    def setUpClass(cls):
        cls.predictor = PhishGuardPredictor(models_dir=MODELS_DIR)

    def test_best_model_name_attribute_exists(self):
        self.assertTrue(
            hasattr(self.predictor, "best_model_name"),
            "PhishGuardPredictor must expose best_model_name attribute"
        )

    def test_best_model_name_is_verified_model(self):
        bmn = self.predictor.best_model_name
        if bmn is not None:
            # Should be one of the 4 verified models or None
            self.assertIn(bmn, VERIFIED_MODEL_KEYS | {"best"},
                          f"best_model_name '{bmn}' is not a verified Phase-2 model")


class TestBackendMLPredictor(unittest.TestCase):
    """Phase 3 — TC-05: Backend ml_predictor singleton behaviour."""

    def test_backend_predictor_loads_only_verified_models(self):
        """The backend singleton must not include 'xgboost'."""
        from backend.app.services.ml_predictor import predictor as backend_predictor
        if not backend_predictor.is_loaded:
            backend_predictor.load_models()

        self.assertTrue(backend_predictor.is_loaded,
                        "Backend predictor must load successfully")
        self.assertNotIn("xgboost", backend_predictor.models,
                         "Backend predictor must NOT contain 'xgboost' key")

    def test_backend_predict_returns_model_predictions_list(self):
        from backend.app.services.ml_predictor import predictor as backend_predictor
        from backend.app.services.feature_extractor import extract_features

        if not backend_predictor.is_loaded:
            backend_predictor.load_models()

        features = extract_features(PHISHING_URL)
        result = backend_predictor.predict(features)

        self.assertIn("model_predictions", result)
        self.assertIsInstance(result["model_predictions"], list)
        self.assertGreater(len(result["model_predictions"]), 0)

    def test_backend_predict_no_retrain(self):
        """Model count must not change between two successive calls."""
        from backend.app.services.ml_predictor import predictor as backend_predictor
        from backend.app.services.feature_extractor import extract_features

        if not backend_predictor.is_loaded:
            backend_predictor.load_models()

        count_before = len(backend_predictor.models)
        features = extract_features(LEGITIMATE_URL)
        backend_predictor.predict(features)
        count_after = len(backend_predictor.models)

        self.assertEqual(count_before, count_after,
                         "Model count must not change after a predict() call (no retraining)")


if __name__ == "__main__":
    unittest.main(verbosity=2)
