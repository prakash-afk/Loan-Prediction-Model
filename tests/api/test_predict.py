import pytest


class TestPredict:
    @pytest.mark.smoke
    def test_predict_valid_applicant(self, session, base_url, valid_applicant_payload):
        """Verify POST /predict returns HTTP 200 and valid prediction probabilities for a valid payload."""
        response = session.post(f"{base_url}/predict", json=valid_applicant_payload)

        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"

        data = response.json()
        assert data.get("prediction") in ["Approved", "Rejected"]
        assert 0.0 <= data.get("probability_approved", -1) <= 1.0
        assert 0.0 <= data.get("probability_rejected", -1) <= 1.0
        assert pytest.approx(data["probability_approved"] + data["probability_rejected"], abs=1e-3) == 1.0

    @pytest.mark.edge
    def test_predict_unexpected_extra_field(self, session, base_url, valid_applicant_payload):
        """Verify POST /predict rejects payloads containing extra forbid fields (e.g. loan_to_income_ratio)."""
        invalid_payload = valid_applicant_payload.copy()
        invalid_payload["loan_to_income_ratio"] = 0.1667

        response = session.post(f"{base_url}/predict", json=invalid_payload)

        assert response.status_code in [400, 422], f"Expected 422 or 400, got {response.status_code}: {response.text}"

    @pytest.mark.edge
    def test_predict_unseen_categorical_value(self, session, base_url, valid_applicant_payload):
        """Verify POST /predict rejects unseen categorical values for string columns."""
        invalid_payload = valid_applicant_payload.copy()
        invalid_payload["occupation_status"] = "Astronaut"

        response = session.post(f"{base_url}/predict", json=invalid_payload)

        assert response.status_code in [400, 422], f"Expected 422 or 400, got {response.status_code}: {response.text}"

    @pytest.mark.edge
    def test_predict_missing_required_field(self, session, base_url, valid_applicant_payload):
        """Verify POST /predict rejects payloads missing a required field (e.g. age)."""
        invalid_payload = valid_applicant_payload.copy()
        del invalid_payload["age"]

        response = session.post(f"{base_url}/predict", json=invalid_payload)

        assert response.status_code in [400, 422], f"Expected 422 or 400, got {response.status_code}: {response.text}"
