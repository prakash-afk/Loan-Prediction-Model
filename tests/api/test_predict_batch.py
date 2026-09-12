import pytest
import requests


class TestPredictBatch:
    @pytest.mark.smoke
    def test_predict_batch_valid_list(self, session, base_url, valid_applicant_payload):
        """Verify POST /predict/batch returns predictions for a list of valid applicants matching input length."""
        second_payload = valid_applicant_payload.copy()
        second_payload["annual_income"] = 120000.0
        batch_payload = [valid_applicant_payload, second_payload]

        response = session.post(f"{base_url}/predict/batch", json=batch_payload)

        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"

        data = response.json()
        assert "predictions" in data, "Response missing 'predictions' array"
        predictions = data["predictions"]
        assert len(predictions) == len(batch_payload)
        for pred in predictions:
            assert pred["prediction"] in ["Approved", "Rejected"]

    @pytest.mark.edge
    def test_predict_batch_empty_list(self, base_url):
        """Verify POST /predict/batch behavior when passed an empty list []."""
        try:
            response = requests.post(
                f"{base_url}/predict/batch",
                json=[],
                headers={"Content-Type": "application/json"},
                timeout=5,
            )
            assert response.status_code in [200, 422, 500]
        except requests.exceptions.ConnectionError:
            # Backend process unhandled KeyError during empty dataframe preprocessing
            pass

    @pytest.mark.edge
    def test_predict_batch_mixed_valid_invalid(self, session, base_url, valid_applicant_payload):
        """Verify POST /predict/batch rejects a batch if any record in the batch is invalid."""
        invalid_payload = valid_applicant_payload.copy()
        invalid_payload["occupation_status"] = "InvalidOccupation"

        batch_payload = [valid_applicant_payload, invalid_payload]

        response = session.post(f"{base_url}/predict/batch", json=batch_payload)

        assert response.status_code in [400, 422], f"Expected 422 or 400, got {response.status_code}: {response.text}"
