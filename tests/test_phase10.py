"""
PhishGuard Phase 10 Comprehensive Test Suite
Automated verification for AI Threat Investigation Engine, Case Management,
Report Generation, and Regression Testing.
"""

import unittest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database import init_db, SessionLocal
from backend.app.models.scan import Scan
from backend.app.models.case import Case


from backend.app.services.ml_predictor import predictor


class TestPhase10InvestigationEngine(unittest.TestCase):
    case_id = None
    linked_case_id = None
    linked_scan_id = None

    @classmethod
    def setUpClass(cls):
        init_db()
        predictor.load_models()
        cls.client = TestClient(app)

    def test_01_create_case(self):
        payload = {
            "url": "http://paypal-verification-update.secure-login-auth.com/verify",
            "verdict": "Phishing",
            "risk_score": 92,
            "severity": "CRITICAL",
            "status": "NEW",
            "analyst_notes": "Credential harvesting vector detected.",
            "assigned_analyst": "SOC Analyst 1",
            "evidence_summary": {"has_ip_address": 0, "has_suspicious_keywords": 2, "num_subdomains": 3}
        }
        res = self.client.post("/api/cases", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("id", data)
        self.assertTrue(data["case_number"].startswith("PG-"))
        self.assertEqual(data["verdict"], "Phishing")
        self.assertEqual(data["risk_score"], 92)
        self.assertEqual(data["status"], "NEW")
        self.__class__.case_id = data["id"]

    def test_02_get_case(self):
        res = self.client.get(f"/api/cases/{self.__class__.case_id}")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["id"], self.__class__.case_id)
        self.assertTrue(data["case_number"].startswith("PG-"))

    def test_03_update_status(self):
        payload = {"status": "INVESTIGATING", "severity": "HIGH"}
        res = self.client.put(f"/api/cases/{self.__class__.case_id}", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "INVESTIGATING")
        self.assertEqual(data["severity"], "HIGH")

    def test_04_save_analyst_notes(self):
        payload = {"analyst_notes": "Updated note: Domain registered recently on free TLD."}
        res = self.client.put(f"/api/cases/{self.__class__.case_id}", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("free TLD", data["analyst_notes"])

    def test_05_update_resolution(self):
        payload = {
            "status": "RESOLVED",
            "resolution": "Confirmed phishing",
            "resolution_notes": "Domain blocked at perimeter firewall."
        }
        res = self.client.put(f"/api/cases/{self.__class__.case_id}", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "RESOLVED")
        self.assertEqual(data["resolution"], "Confirmed phishing")
        self.assertEqual(data["resolution_notes"], "Domain blocked at perimeter firewall.")

    def test_06_search_cases(self):
        res = self.client.get("/api/cases?search=paypal-verification")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertGreaterEqual(data["total"], 1)
        self.assertTrue(any("paypal-verification" in c["url"] for c in data["cases"]))

    def test_07_filter_cases(self):
        res = self.client.get("/api/cases?status=RESOLVED")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertGreaterEqual(data["total"], 1)
        self.assertTrue(all(c["status"] == "RESOLVED" for c in data["cases"]))

    def test_08_link_case_to_scan_and_prevent_duplicate(self):
        # 1. Perform scan to create scan record
        scan_res = self.client.post("/api/scan", json={"url": "http://192.168.1.1/login.php"})
        self.assertEqual(scan_res.status_code, 200)
        scan_data = scan_res.json()
        scan_id = scan_data["id"]

        # 2. Create case linked to scan_id
        case1_res = self.client.post("/api/cases", json={
            "url": scan_data["url"],
            "verdict": scan_data["verdict"],
            "risk_score": scan_data["risk_score"],
            "scan_id": scan_id,
            "status": "NEW"
        })
        self.assertEqual(case1_res.status_code, 200)
        c1 = case1_res.json()
        self.assertEqual(c1["scan_id"], scan_id)

        # 3. Create case again with SAME scan_id (should return existing case, preventing duplicates)
        case2_res = self.client.post("/api/cases", json={
            "url": scan_data["url"],
            "verdict": scan_data["verdict"],
            "risk_score": scan_data["risk_score"],
            "scan_id": scan_id,
            "status": "NEW"
        })
        self.assertEqual(case2_res.status_code, 200)
        c2 = case2_res.json()
        self.assertEqual(c1["id"], c2["id"])

        self.__class__.linked_case_id = c1["id"]
        self.__class__.linked_scan_id = scan_id

    def test_09_generate_report(self):
        # Test JSON format report
        res_json = self.client.get(f"/api/cases/{self.__class__.linked_case_id}/report?format=json")
        self.assertEqual(res_json.status_code, 200)
        report = res_json.json()
        self.assertIn("case_information", report)
        self.assertIn("target_url", report)
        self.assertIn("twenty_two_feature_analysis", report)
        self.assertIn("analyst_assessment", report)

        # Test PDF format report
        res_pdf = self.client.get(f"/api/cases/{self.__class__.linked_case_id}/report?format=pdf")
        self.assertEqual(res_pdf.status_code, 200)
        self.assertIn(res_pdf.headers.get("content-type"), ["application/pdf", "application/json"])

    def test_10_delete_case_preserves_scan_history(self):
        # Delete case
        del_res = self.client.delete(f"/api/cases/{self.__class__.linked_case_id}")
        self.assertEqual(del_res.status_code, 200)

        # Verify case is gone
        get_case_res = self.client.get(f"/api/cases/{self.__class__.linked_case_id}")
        self.assertEqual(get_case_res.status_code, 404)

        # Verify underlying scan STILL EXISTS in scan history (Forensic Integrity)
        scan_history_res = self.client.get(f"/api/report/{self.__class__.linked_scan_id}")
        self.assertEqual(scan_history_res.status_code, 200)
        self.assertEqual(scan_history_res.json()["id"], self.__class__.linked_scan_id)

    # ─── Regression Tests ────────────────────────────────────────────────
    def test_11_regression_scan_endpoint(self):
        res = self.client.post("/api/scan", json={"url": "https://www.wikipedia.org"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("verdict", data)
        self.assertIn("risk_score", data)
        self.assertIn("features", data)
        self.assertEqual(len(data["features"]), 22)

    def test_12_regression_history_endpoint(self):
        res = self.client.get("/api/history?limit=10")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("scans", data)
        self.assertIn("total", data)

    def test_13_regression_analytics_endpoint(self):
        res = self.client.get("/api/analytics")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("total_scans", data)
        self.assertIn("phishing_count", data)

    def test_14_regression_models_compare_endpoint(self):
        res = self.client.get("/api/models/compare")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("models", data)


if __name__ == "__main__":
    unittest.main()
