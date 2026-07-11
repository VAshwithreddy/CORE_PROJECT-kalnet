import unittest

from fastapi.testclient import TestClient

from src.main import app


client = TestClient(app)


class HealthEndpointTests(unittest.TestCase):
    def test_health_endpoint(self) -> None:
        response = client.get("/health")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "status": "ok",
                "service": "CORE API",
                "environment": "development",
            },
        )

    def test_versioned_setup_summary_endpoint(self) -> None:
        response = client.get("/api/v1/setup-summary")

        self.assertEqual(response.status_code, 200)
        self.assertIn("work intake", response.json()["mvp_flow"])


if __name__ == "__main__":
    unittest.main()
