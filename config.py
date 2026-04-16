from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent
DATA_PATH = PROJECT_ROOT / "data" / "dataset.csv"

TARGET_COL = "loan_status"
PALETTE = ["#2EC4B6", "#E71D36", "#FF9F1C", "#4361EE", "#7209B7"]
LABEL_MAP = {0: "Rejected", 1: "Approved"}
