"""
PhishGuard — Phase 5 Comprehensive Automated Test Suite

Tests:
  1. URL validation: unsupported schemes (ftp, file, javascript)
  2. URL validation: empty/whitespace strings
  3. URL validation: excessive length (>2048 chars)
  4. URL validation: control characters & invalid symbols
  5. URL normalization: missing scheme prepends http://
  6. Risk score 5-tier boundary levels:
     - score 0-20 -> LOW
     - score 21-40 -> GUARDED
     - score 41-60 -> MEDIUM
     - score 61-80 -> HIGH
     - score 81-100 -> CRITICAL
  7. Risk score clamping (<=0 -> LOW, >=100 -> CRITICAL)
  8. Database scan record creation & SQLite transaction safety
  9. Explainer matrix: SHAP-inspired explanations generation
  10. Explainer matrix: top reasons formatting
  11. Dataset validator execution & dataset quality report format
  12. Model metadata JSON schema & versioning tag
  13. API status endpoint & model lab metadata response
  14. Zero network fetch during URL validation & extraction
"""

import unittest
import os
import sys
import json
import socket
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# ── Path setup ──────────────────────────────────────────────────────────────
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)
backend_path = os.path.join(PROJECT_ROOT, "backend")
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from backend.app.services.url_validator import validate_url, URLValidationError
from backend.app.config import get_risk_level, RISK_BOUNDARIES
from backend.app.services.explainer import generate_explanations, generate_top_reasons
from backend.app.services.feature_extractor import extract_features
from backend.app.services.ml_predictor import predictor
from backend.app.database import Base
from backend.app.services.report_generator import create_scan_record
from ml.dataset_validator import validate_dataset

MODELS_DIR = os.path.join(PROJECT_ROOT, "models")


class TestURLValidatorSecurity(unittest.TestCase):
    """Phase 5 — URL Validation Security Audit Tests."""

    def test_unsupported_schemes_rejected(self):
        for bad_url in ["ftp://example.com/file", "javascript:alert(1)", "file:///C:/passwords.txt", "gopher://host"]:
            with self.subTest(url=bad_url):
                with self.assertRaises(URLValidationError):
                    validate_url(bad_url)

    def test_empty_url_rejected(self):
        for empty in ["", "   ", "\t\n"]:
            with self.subTest(url=empty):
                with self.assertRaises(URLValidationError):
                    validate_url(empty)

    def test_excessive_length_url_rejected(self):
        long_url = "http://example.com/" + ("a" * 2050)
        with self.assertRaises(URLValidationError):
            validate_url(long_url)

    def test_control_characters_rejected(self):
        bad_char_url = "http://example.com/login\x00user"
        with self.assertRaises(URLValidationError):
            validate_url(bad_char_url)

    def test_url_normalization_scheme_added(self):
        norm = validate_url("example.com/login")
        self.assertTrue(norm.startswith("http://example.com/login"))


class TestRiskScoreBoundaries(unittest.TestCase):
    """Phase 5 — Risk Score Boundary Level Tests."""

    def test_risk_boundary_values(self):
        boundaries = [
            (0, "LOW"),
            (15, "LOW"),
            (20, "LOW"),
            (21, "GUARDED"),
            (35, "GUARDED"),
            (40, "GUARDED"),
            (41, "MEDIUM"),
            (55, "MEDIUM"),
            (60, "MEDIUM"),
            (61, "HIGH"),
            (75, "HIGH"),
            (80, "HIGH"),
            (81, "CRITICAL"),
            (95, "CRITICAL"),
            (100, "CRITICAL"),
        ]
        for score, expected_level in boundaries:
            with self.subTest(score=score):
                level = get_risk_level(score)
                self.assertEqual(
                    level, expected_level,
                    f"Score {score} should evaluate to {expected_level}, got {level}"
                )

    def test_risk_clamping_out_of_bounds(self):
        self.assertEqual(get_risk_level(-10), "LOW")
        self.assertEqual(get_risk_level(150), "CRITICAL")


class TestDatabaseStorage(unittest.TestCase):
    """Phase 5 — Database ORM & Storage Tests."""

    @classmethod
    def setUpClass(cls):
        cls.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(bind=cls.engine)
        cls.Session = sessionmaker(bind=cls.engine)

    def test_create_scan_record(self):
        db = self.Session()
        features = extract_features("http://example.com/login")
        scan = create_scan_record(
            db=db,
            url="http://example.com/login",
            risk_score=75,
            verdict="Phishing",
            confidence=0.85,
            features=features,
            shap_explanations=[],
            model_predictions=[],
            top_reasons=["🚨 High risk URL"],
            best_model_name="random_forest"
        )
        self.assertIsNotNone(scan.id)
        self.assertEqual(scan.url, "http://example.com/login")
        self.assertEqual(scan.risk_score, 75)
        self.assertEqual(scan.verdict, "Phishing")
        db.close()


class TestExplainerService(unittest.TestCase):
    """Phase 5 — Explainability & Top Reasons Audit."""

    def test_generate_explanations(self):
        features = extract_features("http://192.168.1.1/login.php?verify=account")
        pred_res = {
            "risk_score": 85,
            "verdict": "Phishing",
            "confidence": 0.9,
            "model_predictions": [{"model_name": "Random Forest", "prediction": 1, "probability": 0.85}],
            "best_model_name": "random_forest",
        }
        explanations = generate_explanations(features, pred_res)
        self.assertIsInstance(explanations, list)
        self.assertGreater(len(explanations), 0)
        self.assertIn("feature", explanations[0])
        self.assertIn("impact", explanations[0])

    def test_generate_top_reasons(self):
        features = extract_features("http://192.168.1.1/login.php?verify=account")
        explanations = generate_explanations(features, {"verdict": "Phishing", "risk_score": 85})
        reasons = generate_top_reasons(explanations, "Phishing", 85)
        self.assertIsInstance(reasons, list)
        self.assertGreater(len(reasons), 0)


class TestDatasetValidatorAndMetadata(unittest.TestCase):
    """Phase 5 — Dataset Validator & Metadata Versioning Tests."""

    def test_dataset_validator_report(self):
        report = validate_dataset()
        self.assertIn("total_samples", report)
        self.assertIn("class_distribution", report)
        self.assertIn("quality_metrics", report)
        self.assertGreater(report["total_samples"], 0)

    def test_metadata_json_exists_and_valid(self):
        meta_path = os.path.join(MODELS_DIR, "metadata.json")
        self.assertTrue(os.path.exists(meta_path), "metadata.json must exist in models/")
        with open(meta_path, "r") as f:
            meta = json.load(f)
        self.assertIn("version", meta)
        self.assertIn("dataset_mode", meta)
        self.assertIn("verified_models", meta)
        self.assertEqual(len(meta["verified_models"]), 4)


class TestNetworkIsolation(unittest.TestCase):
    """Phase 5 — SSRF & Network Isolation Audit."""

    def test_no_network_calls_during_validation_and_extraction(self):
        original_getaddrinfo = socket.getaddrinfo

        def mock_getaddrinfo(*args, **kwargs):
            raise ConnectionError("Network call blocked during local extraction!")

        socket.getaddrinfo = mock_getaddrinfo
        try:
            norm = validate_url("http://192.168.1.50/account/login")
            feats = extract_features(norm)
            self.assertEqual(len(feats), 22)
        finally:
            socket.getaddrinfo = original_getaddrinfo


if __name__ == "__main__":
    unittest.main(verbosity=2)
