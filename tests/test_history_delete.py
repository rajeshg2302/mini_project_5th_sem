"""
PhishGuard Unit & Integration Tests for Scan History Removal Upgrade
"""

import json
import unittest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database import init_db, SessionLocal
from backend.app.models.scan import Scan
from backend.app.services.ml_predictor import predictor


class TestHistoryDeleteFeatures(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()
        predictor.load_models()
        cls.client = TestClient(app)

    def setUp(self):
        # Seed test scan records into DB for each test
        db = SessionLocal()
        db.query(Scan).delete()
        db.commit()

        dummy_features = json.dumps({"url_length": 30, "has_https": 1})
        dummy_json = json.dumps([])

        s1 = Scan(url="http://test-safe-domain-1.com", risk_score=10, verdict="Safe", confidence=0.9, features=dummy_features, shap_values=dummy_json, model_predictions=dummy_json, top_reasons=dummy_json)
        s2 = Scan(url="http://test-phish-domain-2.com", risk_score=85, verdict="Phishing", confidence=0.95, features=dummy_features, shap_values=dummy_json, model_predictions=dummy_json, top_reasons=dummy_json)
        s3 = Scan(url="http://test-suspicious-domain-3.com", risk_score=55, verdict="Suspicious", confidence=0.7, features=dummy_features, shap_values=dummy_json, model_predictions=dummy_json, top_reasons=dummy_json)
        db.add_all([s1, s2, s3])
        db.commit()
        db.refresh(s1)
        db.refresh(s2)
        db.refresh(s3)

        self.s1_id = s1.id
        self.s2_id = s2.id
        self.s3_id = s3.id
        db.close()

    def test_01_delete_valid_scan(self):
        res = self.client.delete(f"/api/history/{self.s2_id}")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data.get("success"))
        self.assertIn("deleted successfully", data.get("message"))

        # Verify DB deletion
        db = SessionLocal()
        deleted_scan = db.query(Scan).filter(Scan.id == self.s2_id).first()
        self.assertIsNone(deleted_scan)
        db.close()

    def test_02_delete_nonexistent_scan(self):
        res = self.client.delete("/api/history/999999")
        self.assertEqual(res.status_code, 404)

    def test_03_delete_selected_scan_preserves_others(self):
        res = self.client.delete(f"/api/history/{self.s1_id}")
        self.assertEqual(res.status_code, 200)

        # Verify other scans remain
        db = SessionLocal()
        remaining = db.query(Scan).all()
        remaining_ids = [s.id for s in remaining]
        self.assertNotIn(self.s1_id, remaining_ids)
        self.assertIn(self.s2_id, remaining_ids)
        self.assertIn(self.s3_id, remaining_ids)
        db.close()

    def test_04_clear_all_history(self):
        res = self.client.delete("/api/history")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data.get("success"))
        self.assertEqual(data.get("deleted_count"), 3)

        # Verify database is completely empty
        db = SessionLocal()
        count = db.query(Scan).count()
        self.assertEqual(count, 0)
        db.close()

    def test_05_clear_empty_history(self):
        # Clear once
        self.client.delete("/api/history")

        # Clear again when empty
        res = self.client.delete("/api/history")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data.get("success"))
        self.assertEqual(data.get("deleted_count"), 0)

    def test_06_analytics_consistency_after_delete(self):
        # Initial count is 3
        analytics_before = self.client.get("/api/analytics").json()
        self.assertEqual(analytics_before["total_scans"], 3)

        # Delete one scan
        self.client.delete(f"/api/history/{self.s2_id}")

        # Analytics count should be reduced to 2
        analytics_after = self.client.get("/api/analytics").json()
        self.assertEqual(analytics_after["total_scans"], 2)


if __name__ == "__main__":
    unittest.main()
