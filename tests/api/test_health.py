import pytest


class TestHealth:
    @pytest.mark.smoke
    def test_health_check_returns_200_and_ok(self, session, base_url):
        """Verify GET /health returns HTTP 200 with status 'ok', model_name, and feature_count."""
        response = session.get(f"{base_url}/health")

        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"

        data = response.json()
        assert data.get("status") == "ok", f"Expected status 'ok', got {data.get('status')}"
        assert "model_name" in data, "Response missing 'model_name' key"
        assert isinstance(data["model_name"], str) and len(data["model_name"]) > 0
        assert "feature_count" in data, "Response missing 'feature_count' key"
        assert isinstance(data["feature_count"], int) and data["feature_count"] > 0
