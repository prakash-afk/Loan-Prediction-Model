from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATA_PATH = PROJECT_ROOT / "data" / "dataset.csv"
ARTIFACTS_DIR = PROJECT_ROOT / "artifacts"
BEST_MODEL_PATH = ARTIFACTS_DIR / "best_model.pkl"
SCALER_PATH = ARTIFACTS_DIR / "scaler.pkl"
ENCODERS_PATH = ARTIFACTS_DIR / "encoders.pkl"
FEATURE_COLUMNS_PATH = ARTIFACTS_DIR / "feature_columns.json"

TARGET_COL = "loan_status"
PALETTE = ["#2EC4B6", "#E71D36", "#FF9F1C", "#4361EE", "#7209B7"]
LABEL_MAP = {0: "Rejected", 1: "Approved"}

SKEWED_COLUMNS = [
    "annual_income",
    "savings_assets",
    "current_debt",
    "loan_amount",
]

CAP_COLUMNS = ["annual_income", "savings_assets", "current_debt", "loan_amount"]
CATEGORICAL_COLUMNS = ["occupation_status", "product_type", "loan_intent"]
DROP_COLUMNS_AFTER_PREPROCESSING = ["derogatory_marks", "loan_to_income_ratio"]

API_INPUT_FIELDS = [
    "age",
    "occupation_status",
    "years_employed",
    "annual_income",
    "credit_score",
    "credit_history_years",
    "savings_assets",
    "current_debt",
    "defaults_on_file",
    "delinquencies_last_2yrs",
    "derogatory_marks",
    "product_type",
    "loan_intent",
    "loan_amount",
    "interest_rate",
    "debt_to_income_ratio",
    "loan_to_income_ratio",
    "payment_to_income_ratio",
]
