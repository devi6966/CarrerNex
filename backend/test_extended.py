import unittest
from fastapi.testclient import TestClient
from main import app

class TestExtendedPlacementFeatures(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_root_health(self):
        res = self.client.get("/health")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["status"], "healthy")

    def test_placement_quiz_sizes_and_fallbacks(self):
        # 10 Questions
        res10 = self.client.post(
            "/api/interview/generate-quiz",
            json={
                "job_role": "Full Stack Developer",
                "difficulty": "Level-2",
                "question_count": 10,
                "topic_category": "Data Structures & Algorithms"
            }
        )
        self.assertEqual(res10.status_code, 200)
        data10 = res10.json()
        self.assertGreaterEqual(len(data10["questions"]), 10)
        self.assertIn("time_limit_minutes", data10)

        # 20 Questions
        res20 = self.client.post(
            "/api/interview/generate-quiz",
            json={
                "job_role": "Backend Engineer",
                "difficulty": "Level-1",
                "question_count": 20,
                "topic_category": "Databases & SQL"
            }
        )
        self.assertEqual(res20.status_code, 200)
        data20 = res20.json()
        self.assertGreaterEqual(len(data20["questions"]), 20)

    def test_hr_interview_lifecycle(self):
        # 1. Start HR chat
        res_start = self.client.post(
            "/api/hr/chat",
            json={
                "job_role": "DevOps Architect",
                "user_message": "",
                "chat_history": []
            }
        )
        self.assertEqual(res_start.status_code, 200)
        first_q = res_start.json()["content"]
        self.assertTrue(len(first_q) > 10)

        # 2. Respond to HR
        res_reply = self.client.post(
            "/api/hr/chat",
            json={
                "job_role": "DevOps Architect",
                "user_message": "I have 4 years of experience building Kubernetes clusters and CI/CD pipelines on AWS.",
                "chat_history": [{"role": "model", "content": first_q}]
            }
        )
        self.assertEqual(res_reply.status_code, 200)
        second_q = res_reply.json()["content"]
        self.assertTrue(len(second_q) > 5)

        # 3. Evaluate HR session
        res_eval = self.client.post(
            "/api/hr/end",
            json={
                "chat_history": [
                    {"role": "model", "content": first_q},
                    {"role": "user", "content": "I built zero-downtime deployment pipelines that reduced release failures by 40%."},
                    {"role": "model", "content": second_q},
                    {"role": "user", "content": "I handle conflicts by listening to teammate concerns and aligning on measurable KPIs."}
                ]
            }
        )
        self.assertEqual(res_eval.status_code, 200)
        eval_data = res_eval.json()
        self.assertIn("hr_score", eval_data)
        self.assertIn("communication_score", eval_data)
        self.assertIn("confidence_score", eval_data)
        self.assertIn("fluency_score", eval_data)
        self.assertIn("grammar_score", eval_data)
        self.assertGreaterEqual(len(eval_data["strengths"]), 1)

if __name__ == "__main__":
    unittest.main()
