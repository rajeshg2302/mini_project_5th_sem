"""
PhishGuard Unit & Integration Tests for Case Management (Phase 10)
"""

import unittest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database import init_db


class TestCaseManagement(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()
        cls.client = TestClient(app)

    def test_create_and_manage_case(self):
        # 1. Create Case
        payload = {
            "url": "http://paypal-security-update.account-verification-login.com/auth",
            "verdict": "Phishing",
            "risk_score": 88,
            "severity": "CRITICAL",
            "status": "NEW",
            "analyst_notes": "Credential harvesting vector flagged during automated scan.",
            "assigned_analyst": "SOC Analyst 1",
            "evidence_summary": {"has_ip": 0, "has_keywords": 1, "subdomains": 3}
        }
        res = self.client.post("/api/cases", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("id", data)
        self.assertTrue(data["case_number"].startswith("PG-"))
        self.assertEqual(data["verdict"], "Phishing")
        self.assertEqual(data["status"], "NEW")
        case_id = data["id"]

        # 2. Get Case by ID
        res_get = self.client.get(f"/api/cases/{case_id}")
        self.assertEqual(res_get.status_code, 200)
        self.assertEqual(res_get.json()["case_number"], data["case_number"])

        # 3. Update Case Status & Notes
        update_payload = {
            "status": "INVESTIGATING",
            "analyst_notes": "Analyst confirmed suspicious domain pattern.",
            "severity": "HIGH"
        }
        res_put = self.client.put(f"/api/cases/{case_id}", json=update_payload)
        self.assertEqual(res_put.status_code, 200)
        updated_data = res_put.json()
        self.assertEqual(updated_data["status"], "INVESTIGATING")
        self.assertEqual(updated_data["severity"], "HIGH")

        # 4. List Cases with Filter
        res_list = self.client.get("/api/cases?status=INVESTIGATING")
        self.assertEqual(res_list.status_code, 200)
        list_data = res_list.json()
        self.assertGreaterEqual(list_data["total"], 1)

        # 5. Delete Case
        res_del = self.client.delete(f"/api/cases/{case_id}")
        self.assertEqual(res_del.status_code, 200)


if __name__ == "__main__":
    unittest.main()
