import json

import joblib

from app.core.config import BEST_MODEL_PATH, ENCODERS_PATH, FEATURE_COLUMNS_PATH, SCALER_PATH


def save_training_artifacts(best_model, scaler, encoders, cap_bounds, feature_columns, best_name):
    BEST_MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)

    joblib.dump(best_model, BEST_MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)
    joblib.dump(
        {
            "encoders": encoders,
            "cap_bounds": cap_bounds,
            "best_model_name": best_name,
            "uses_scaler": best_name == "Logistic Regression",
        },
        ENCODERS_PATH,
    )

    with FEATURE_COLUMNS_PATH.open("w", encoding="utf-8") as file:
        json.dump(feature_columns, file, indent=2)
