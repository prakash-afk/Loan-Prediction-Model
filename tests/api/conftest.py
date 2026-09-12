import os
import pytest
import requests


@pytest.fixture(scope="session")
def base_url():
    """Returns the base API URL from environment variable or default localhost URL."""
    return os.getenv("API_BASE_URL", "http://127.0.0.1:8000").rstrip("/")


@pytest.fixture(scope="session")
def session():
    """Provides a requests.Session with default JSON headers across test runs."""
    http_session = requests.Session()
    http_session.headers.update({"Content-Type": "application/json"})
    yield http_session
    http_session.close()


@pytest.fixture
def valid_applicant_payload():
    """Provides a valid applicant payload strictly matching the 17 expected API fields.

    Note: `loan_to_income_ratio` is excluded as it was removed from API_INPUT_FIELDS.
    """
    return {
        "age": 34,
        "occupation_status": "Employed",
        "years_employed": 7.5,
        "annual_income": 72000.0,
        "credit_score": 710,
        "credit_history_years": 10.2,
        "savings_assets": 18000.0,
        "current_debt": 9500.0,
        "defaults_on_file": 0,
        "delinquencies_last_2yrs": 1,
        "derogatory_marks": 0,
        "product_type": "Personal Loan",
        "loan_intent": "Home Improvement",
        "loan_amount": 12000.0,
        "interest_rate": 11.5,
        "debt_to_income_ratio": 0.1319,
        "payment_to_income_ratio": 0.0192,
    }
