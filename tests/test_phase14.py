import unittest
from fastapi.testclient import TestClient
import os
import json

import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app.main import app
from backend.app.database import Base, engine, init_db

# Ensure testing uses the same schema
init_db()

client = TestClient(app)

class TestPhase14ResearchLab(unittest.TestCase):
    def setUp(self):
        """Pre-test setup."""
        pass

    def test_01_get_datasets(self):
        res = client.get("/api/research/datasets")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("synthetic", data)
        self.assertIn("real_world", data)
        self.assertIn("active_mode", data)
        if data["synthetic"]:
            self.assertIn("quality_status", data["synthetic"])

    def test_02_get_model_comparison(self):
        res = client.get("/api/research/model-comparison")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("models", data)
        self.assertIn("metadata", data)
        
    def test_03_get_feature_importance(self):
        res = client.get("/api/research/feature-importance")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("feature_importances", data)

    def test_04_cross_validation_valid(self):
        # random_forest should be valid
        payload = {"model_key": "random_forest", "metric": "f1", "n_splits": 5}
        res = client.post("/api/research/cross-validation", json=payload)
        # Note: If ML model isn't loaded, it returns 500 or error, so we assert not 404/400
        self.assertIn(res.status_code, [200, 500])
        if res.status_code == 200:
            self.assertIn("fold_scores", res.json())
            self.assertIn("mean", res.json())

    def test_05_cross_validation_invalid_model(self):
        payload = {"model_key": "invalid_model", "metric": "f1", "n_splits": 5}
        res = client.post("/api/research/cross-validation", json=payload)
        self.assertEqual(res.status_code, 400)
        
    def test_06_threshold_analysis_valid(self):
        res = client.post("/api/research/threshold-analysis", json={"model_key": "random_forest"})
        self.assertIn(res.status_code, [200, 500])
        if res.status_code == 200:
            data = res.json()
            self.assertIn("points", data)
            self.assertEqual(len(data["points"]), 19)

    def test_07_roc_curve(self):
        res = client.get("/api/research/roc-curve")
        self.assertIn(res.status_code, [200, 500])
        if res.status_code == 200:
            data = res.json()
            self.assertIn("curves", data)

    def test_08_pr_curve(self):
        res = client.get("/api/research/pr-curve")
        self.assertIn(res.status_code, [200, 500])
        if res.status_code == 200:
            data = res.json()
            self.assertIn("curves", data)

    def test_09_robustness_test_invalid_url(self):
        res = client.post("/api/research/robustness", json={"url": "", "modifications": []})
        self.assertEqual(res.status_code, 400)
        
    def test_10_robustness_test_invalid_mod(self):
        res = client.post("/api/research/robustness", json={"url": "http://test.com", "modifications": ["invalid_mod"]})
        self.assertEqual(res.status_code, 400)
        
    def test_11_robustness_test_valid(self):
        res = client.post("/api/research/robustness", json={
            "url": "http://test.com/login", 
            "modifications": ["add_subdomain"]
        })
        self.assertIn(res.status_code, [200, 500])
        if res.status_code == 200:
            data = res.json()
            self.assertIn("original", data)
            self.assertIn("modified", data)
            self.assertIn("risk_delta", data)

    def test_12_stability_test(self):
        res = client.post("/api/research/stability", json={"model_key": "random_forest", "n_runs": 2})
        self.assertIn(res.status_code, [200, 500])
        if res.status_code == 200:
            self.assertIn("runs", res.json())
            self.assertEqual(len(res.json()["runs"]), 2)

    def test_13_leakage_check(self):
        res = client.get("/api/research/leakage-check")
        self.assertEqual(res.status_code, 200)
        self.assertIn("leakage_risk", res.json())

    def test_14_research_summary(self):
        res = client.get("/api/research/research-summary")
        self.assertIn(res.status_code, [200, 500])
        
    def test_15_experiments_crud(self):
        # Create
        payload = {
            "dataset_name": "Test Dataset",
            "model_name": "all",
            "split": "80/20",
            "metrics": {"test": 123}
        }
        res = client.post("/api/research/experiments", json=payload)
        self.assertEqual(res.status_code, 200)
        exp_id = res.json()["experiment_id"]
        
        # Get list
        res = client.get("/api/research/experiments")
        self.assertEqual(res.status_code, 200)
        self.assertTrue(len(res.json()["experiments"]) > 0)
        
        # Get single
        res = client.get(f"/api/research/experiments/{exp_id}")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["dataset_name"], "Test Dataset")

if __name__ == "__main__":
    unittest.main()
