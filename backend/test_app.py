import unittest
from fastapi.testclient import TestClient
from main import app

class TestPlacementPortalBackend(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_health_endpoint(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "online")

    def test_ats_endpoint_validation(self):
        # Empty job description (whitespace only) should return 400
        response = self.client.post(
            "/api/ats/check-resume",
            data={"job_description": "   "},
            files={"resume": ("resume.pdf", b"%PDF-1.4...", "application/pdf")}
        )
        self.assertEqual(response.status_code, 400)

        # Non-PDF files should be rejected with 400
        response = self.client.post(
            "/api/ats/check-resume",
            data={"job_description": "Python Developer"},
            files={"resume": ("resume.txt", b"plain text", "text/plain")}
        )
        self.assertEqual(response.status_code, 400)

    def test_interview_endpoint_validation(self):
        # Empty job role or invalid difficulty should return 400
        response = self.client.post(
            "/api/interview/generate-quiz",
            json={
                "job_role": "",
                "difficulty": "Level-1"
            }
        )
        self.assertEqual(response.status_code, 400)

        response = self.client.post(
            "/api/interview/generate-quiz",
            json={
                "job_role": "Python Developer",
                "difficulty": "Level-99"
            }
        )
        self.assertEqual(response.status_code, 400)

    def test_hr_endpoints_validation(self):
        # Empty job role should return 400 in HR chat
        response = self.client.post(
            "/api/hr/chat",
            json={
                "job_role": " ",
                "user_message": "Hello",
                "chat_history": []
            }
        )
        self.assertEqual(response.status_code, 400)

        # Empty chat history should return 400 in HR end evaluation
        response = self.client.post(
            "/api/hr/end",
            json={
                "chat_history": []
            }
        )
        self.assertEqual(response.status_code, 400)

if __name__ == "__main__":
    unittest.main()
