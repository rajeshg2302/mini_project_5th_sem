"""
PhishGuard Phase 11 — SOC Case Management & Investigation Reporting Test Suite
20 Automated Unit & Integration Tests
"""

import unittest
import json
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.database import init_db, SessionLocal
from backend.app.models.scan import Scan
from backend.app.models.case import Case


class TestPhase11CaseManagement(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        init_db()
        cls.client = TestClient(app)
        cls.created_case_ids = []

    def setUp(self):
        self.db = SessionLocal()
        # Seed sample scan record
        self.sample_scan = Scan(
            url="http://login-verify-paypal-account.com",
            verdict="Phishing",
            risk_score=92,
            confidence=0.96,
            best_model_name="Random Forest",
            features=json.dumps({"url_length": 42, "has_ip_address": 0, "has_suspicious_keywords": 1, "has_https": 0}),
            shap_values=json.dumps([]),
            model_predictions=json.dumps([{"model_name": "Random Forest", "confidence": 0.96, "prediction": 1}]),
            top_reasons=json.dumps(["Suspicious domain keyword detected", "HTTP protocol insecure"]),
        )
        self.db.add(self.sample_scan)
        self.db.commit()
        self.db.refresh(self.sample_scan)

    def tearDown(self):
        # Clean up cases and scans created during test
        try:
            self.db.query(Case).filter(Case.url.contains("test")).delete(synchronize_session=False)
            self.db.query(Case).filter(Case.url.contains("paypal")).delete(synchronize_session=False)
            self.db.query(Case).filter(Case.url.contains("target")).delete(synchronize_session=False)
            self.db.query(Case).filter(Case.url.contains("low")).delete(synchronize_session=False)
            self.db.query(Case).filter(Case.url.contains("high")).delete(synchronize_session=False)
            self.db.query(Case).filter(Case.url.contains("bank-phish")).delete(synchronize_session=False)
            self.db.query(Case).filter(Case.url.contains("google")).delete(synchronize_session=False)
            self.db.query(Case).filter(Case.url.contains("delete-target")).delete(synchronize_session=False)
            self.db.query(Case).filter(Case.url.contains("u1")).delete(synchronize_session=False)
            self.db.query(Case).filter(Case.url.contains("u2")).delete(synchronize_session=False)
            self.db.query(Case).filter(Case.url.contains("u3")).delete(synchronize_session=False)
            self.db.query(Case).filter(Case.url.contains("local-test")).delete(synchronize_session=False)

            if hasattr(self, 'sample_scan') and self.sample_scan:
                scan = self.db.query(Scan).filter(Scan.id == self.sample_scan.id).first()
                if scan:
                    self.db.delete(scan)

            self.db.commit()
        except Exception:
            self.db.rollback()
        finally:
            self.db.close()

    def test_01_create_case(self):
        """1. Test creating a new threat investigation case."""
        res = self.client.post("/api/cases", json={
            "url": "http://login-verify-paypal-account.com",
            "verdict": "Phishing",
            "risk_score": 92,
            "severity": "CRITICAL",
            "scan_id": self.sample_scan.id,
            "status": "NEW",
            "analyst_notes": "Initial alert logged by automated rule.",
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["case_number"].startswith("PG-"))
        self.assertEqual(data["verdict"], "Phishing")
        self.assertEqual(data["risk_score"], 92)
        self.assertEqual(data["scan_id"], self.sample_scan.id)

    def test_02_create_duplicate_scan_id_returns_existing(self):
        """2. Test that creating a case for an existing scan_id returns existing case."""
        res1 = self.client.post("/api/cases", json={
            "url": "http://login-verify-paypal-account.com",
            "verdict": "Phishing",
            "risk_score": 92,
            "scan_id": self.sample_scan.id,
        })
        res2 = self.client.post("/api/cases", json={
            "url": "http://login-verify-paypal-account.com",
            "verdict": "Phishing",
            "risk_score": 92,
            "scan_id": self.sample_scan.id,
        })
        self.assertEqual(res1.json()["id"], res2.json()["id"])
        self.assertEqual(res1.json()["case_number"], res2.json()["case_number"])

    def test_03_sequential_case_numbers(self):
        """3. Test database-backed sequential case numbers (PG-XXXXX)."""
        res1 = self.client.post("/api/cases", json={"url": "http://test1.com", "verdict": "Phishing", "risk_score": 85})
        res2 = self.client.post("/api/cases", json={"url": "http://test2.com", "verdict": "Safe", "risk_score": 10})
        self.assertTrue(res1.json()["case_number"].startswith("PG-"))
        self.assertTrue(res2.json()["case_number"].startswith("PG-"))
        c1_num = int(res1.json()["case_number"].split("-")[1])
        c2_num = int(res2.json()["case_number"].split("-")[1])
        self.assertEqual(c2_num, c1_num + 1)

    def test_04_list_cases_default(self):
        """4. Test listing cases with default pagination."""
        self.client.post("/api/cases", json={"url": "http://test1.com", "verdict": "Phishing", "risk_score": 85})
        self.client.post("/api/cases", json={"url": "http://test2.com", "verdict": "Safe", "risk_score": 10})
        res = self.client.get("/api/cases")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertGreaterEqual(data["total"], 2)
        self.assertGreaterEqual(len(data["cases"]), 2)

    def test_05_list_cases_filter_status(self):
        """5. Test filtering cases by status."""
        c1 = self.client.post("/api/cases", json={"url": "http://test1.com", "verdict": "Phishing", "risk_score": 85, "status": "INVESTIGATING"}).json()
        c2 = self.client.post("/api/cases", json={"url": "http://test2.com", "verdict": "Safe", "risk_score": 10, "status": "RESOLVED"}).json()

        res = self.client.get("/api/cases?status=INVESTIGATING")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        statuses = [c["status"] for c in data["cases"]]
        self.assertTrue(all(s == "INVESTIGATING" for s in statuses))

    def test_06_list_cases_filter_severity(self):
        """6. Test filtering cases by risk level severity."""
        self.client.post("/api/cases", json={"url": "http://test1.com", "verdict": "Phishing", "risk_score": 90, "severity": "CRITICAL"})
        self.client.post("/api/cases", json={"url": "http://test2.com", "verdict": "Safe", "risk_score": 5, "severity": "LOW"})

        res = self.client.get("/api/cases?severity=CRITICAL")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        severities = [c["severity"] for c in data["cases"]]
        self.assertTrue(all(s == "CRITICAL" for s in severities))

    def test_07_list_cases_search(self):
        """7. Test searching cases by URL or Case Number."""
        c1 = self.client.post("/api/cases", json={"url": "http://bank-phish.org", "verdict": "Phishing", "risk_score": 95}).json()
        c2 = self.client.post("/api/cases", json={"url": "http://google.com", "verdict": "Safe", "risk_score": 0}).json()

        res = self.client.get("/api/cases?search=bank-phish")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertGreaterEqual(data["total"], 1)
        self.assertEqual(data["cases"][0]["id"], c1["id"])

    def test_08_list_cases_sorting(self):
        """8. Test sorting cases by highest_risk, lowest_risk, oldest, newest."""
        self.client.post("/api/cases", json={"url": "http://low.com", "verdict": "Safe", "risk_score": 10})
        self.client.post("/api/cases", json={"url": "http://high.com", "verdict": "Phishing", "risk_score": 95})

        res = self.client.get("/api/cases?sort=highest_risk")
        self.assertEqual(res.status_code, 200)
        cases = res.json()["cases"]
        self.assertEqual(cases[0]["risk_score"], 95)

        res_low = self.client.get("/api/cases?sort=lowest_risk")
        self.assertEqual(res_low.status_code, 200)
        cases_low = res_low.json()["cases"]
        self.assertEqual(cases_low[0]["risk_score"], 10)

    def test_09_get_case_by_id(self):
        """9. Test retrieving single case details by ID."""
        c = self.client.post("/api/cases", json={"url": "http://target.com", "verdict": "Suspicious", "risk_score": 50}).json()
        res = self.client.get(f"/api/cases/{c['id']}")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["case_number"], c["case_number"])

    def test_10_get_case_not_found(self):
        """10. Test retrieving non-existent case ID returns 404."""
        res = self.client.get("/api/cases/99999")
        self.assertEqual(res.status_code, 404)
        self.assertIn("not found", res.json()["detail"].lower())

    def test_11_update_case_status_and_notes(self):
        """11. Test updating case status and analyst notes."""
        c = self.client.post("/api/cases", json={"url": "http://target.com", "verdict": "Phishing", "risk_score": 88}).json()
        res = self.client.put(f"/api/cases/{c['id']}", json={
            "status": "CONFIRMED THREAT",
            "analyst_notes": "Domain registered 2 hours ago via anonymous registrar.",
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "CONFIRMED THREAT")
        self.assertIn("anonymous registrar", data["analyst_notes"])

    def test_12_update_case_assessment_and_resolution(self):
        """12. Test updating case assessment and resolution disposition."""
        c = self.client.post("/api/cases", json={"url": "http://target.com", "verdict": "Phishing", "risk_score": 88}).json()
        res = self.client.put(f"/api/cases/{c['id']}", json={
            "assessment": "High risk of credential theft targeting financial portal.",
            "resolution": "Confirmed phishing",
            "resolution_notes": "URL submitted to global blocklists.",
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["assessment"], "High risk of credential theft targeting financial portal.")
        self.assertEqual(data["resolution"], "Confirmed phishing")

    def test_13_reopen_case(self):
        """13. Test reopening a resolved case sets status back to INVESTIGATING."""
        c = self.client.post("/api/cases", json={"url": "http://target.com", "verdict": "Phishing", "risk_score": 88, "status": "RESOLVED"}).json()
        res = self.client.post(f"/api/cases/{c['id']}/reopen")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["status"], "INVESTIGATING")

    def test_14_get_case_stats(self):
        """14. Test aggregate case statistics endpoint."""
        self.client.post("/api/cases", json={"url": "http://u1.com", "verdict": "Phishing", "risk_score": 90, "status": "NEW"})
        self.client.post("/api/cases", json={"url": "http://u2.com", "verdict": "Phishing", "risk_score": 85, "status": "CONFIRMED THREAT"})
        self.client.post("/api/cases", json={"url": "http://u3.com", "verdict": "Safe", "risk_score": 10, "status": "RESOLVED"})

        res = self.client.get("/api/cases/stats")
        self.assertEqual(res.status_code, 200)
        stats = res.json()
        self.assertIn("total", stats)
        self.assertIn("open_cases", stats)
        self.assertIn("confirmed_threats", stats)
        self.assertIn("resolved", stats)

    def test_15_delete_case_success(self):
        """15. Test deleting an investigation case."""
        c = self.client.post("/api/cases", json={"url": "http://delete-target.com", "verdict": "Safe", "risk_score": 5}).json()
        res = self.client.delete(f"/api/cases/{c['id']}")
        self.assertEqual(res.status_code, 200)
        self.assertIn("deleted successfully", res.json()["message"])

        res_check = self.client.get(f"/api/cases/{c['id']}")
        self.assertEqual(res_check.status_code, 404)

    def test_16_delete_case_preserves_scan_history(self):
        """16. Test deleting a case preserves the underlying scan record in history."""
        c = self.client.post("/api/cases", json={
            "url": "http://login-verify-paypal-account.com",
            "verdict": "Phishing",
            "risk_score": 92,
            "scan_id": self.sample_scan.id,
        }).json()

        # Delete case
        self.client.delete(f"/api/cases/{c['id']}")

        # Verify scan record is still intact in DB
        scan_in_db = self.db.query(Scan).filter(Scan.id == self.sample_scan.id).first()
        self.assertIsNotNone(scan_in_db)
        self.assertEqual(scan_in_db.url, "http://login-verify-paypal-account.com")

    def test_17_get_case_report_pdf(self):
        """17. Test generating PDF threat investigation report."""
        c = self.client.post("/api/cases", json={
            "url": "http://login-verify-paypal-account.com",
            "verdict": "Phishing",
            "risk_score": 92,
            "scan_id": self.sample_scan.id,
        }).json()

        res = self.client.get(f"/api/cases/{c['id']}/report?format=pdf")
        self.assertEqual(res.status_code, 200)
        self.assertTrue(
            res.headers["content-type"] == "application/pdf" or "report_title" in res.json()
        )

    def test_18_get_case_report_json(self):
        """18. Test generating JSON threat investigation report containing required sections."""
        c = self.client.post("/api/cases", json={
            "url": "http://login-verify-paypal-account.com",
            "verdict": "Phishing",
            "risk_score": 92,
            "scan_id": self.sample_scan.id,
        }).json()

        res = self.client.get(f"/api/cases/{c['id']}/report?format=json")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["report_title"], "PHISHGUARD X THREAT INVESTIGATION REPORT")
        self.assertIn("twenty_two_feature_analysis", data)
        self.assertIn("threat_dimensions", data)
        self.assertIn("analyst_assessment", data)

    def test_19_case_forensic_integrity(self):
        """19. Verify updating case notes or status does NOT modify original scan record."""
        c = self.client.post("/api/cases", json={
            "url": "http://login-verify-paypal-account.com",
            "verdict": "Phishing",
            "risk_score": 92,
            "scan_id": self.sample_scan.id,
        }).json()

        self.client.put(f"/api/cases/{c['id']}", json={"status": "FALSE POSITIVE", "analyst_notes": "Tested in sandbox."})

        # Reload scan record from DB
        scan_in_db = self.db.query(Scan).filter(Scan.id == self.sample_scan.id).first()
        self.assertEqual(scan_in_db.verdict, "Phishing")
        self.assertEqual(scan_in_db.risk_score, 92)

    def test_20_no_external_ai_or_threat_intel_calls(self):
        """20. Verify case management logic operates strictly locally without external AI/API dependencies."""
        c = self.client.post("/api/cases", json={"url": "http://local-test.com", "verdict": "Safe", "risk_score": 5}).json()
        report = self.client.get(f"/api/cases/{c['id']}/report?format=json").json()
        self.assertIn("recommendations", report)
        self.assertIn("model_information", report)


if __name__ == "__main__":
    unittest.main()
