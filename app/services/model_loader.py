import json
from dataclasses import dataclass
from typing import Any

import joblib

from app.core.config import BEST_MODEL_PATH, ENCODERS_PATH, FEATURE_COLUMNS_PATH, SCALER_PATH


@dataclass
class LoadedArtifacts:
    model: Any
    scaler: Any
    encoders: dict[str, Any]
    cap_bounds: dict[str, tuple[float, float]]
    feature_columns: list[str]
    uses_scaler: bool
    best_model_name: str


def load_model_artifacts() -> LoadedArtifacts:
    missing_paths = [
        path
        for path in [BEST_MODEL_PATH, SCALER_PATH, ENCODERS_PATH, FEATURE_COLUMNS_PATH]
        if not path.exists()
    ]
    if missing_paths:
        missing_text = ", ".join(str(path) for path in missing_paths)
        raise FileNotFoundError(
            f"Missing model artifacts: {missing_text}. Run the training pipeline first."
        )

    model = joblib.load(BEST_MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
    encoder_payload = joblib.load(ENCODERS_PATH)

    with FEATURE_COLUMNS_PATH.open("r", encoding="utf-8") as file:
        feature_columns = json.load(file)

    return LoadedArtifacts(
        model=model,
        scaler=scaler,
        encoders=encoder_payload["encoders"],
        cap_bounds=encoder_payload["cap_bounds"],
        feature_columns=feature_columns,
        uses_scaler=encoder_payload["uses_scaler"],
        best_model_name=encoder_payload["best_model_name"],
    )
