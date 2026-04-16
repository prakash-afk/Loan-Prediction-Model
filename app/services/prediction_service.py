import numpy as np
import pandas as pd

from app.core.config import CATEGORICAL_COLUMNS, SKEWED_COLUMNS
from app.schemas.response import PredictionResponse
from app.services.model_loader import LoadedArtifacts


def build_input_dataframe(records: list[dict]) -> pd.DataFrame:
    return pd.DataFrame(records)


def apply_inference_preprocessing(df: pd.DataFrame, artifacts: LoadedArtifacts) -> pd.DataFrame:
    processed_df = df.copy()

    for col in SKEWED_COLUMNS:
        processed_df[col] = np.log1p(processed_df[col])

    processed_df["has_derog"] = (processed_df["derogatory_marks"] > 0).astype(int)
    processed_df.drop(columns=["derogatory_marks"], axis=1, inplace=True)

    for col, bounds in artifacts.cap_bounds.items():
        lower, upper = bounds
        processed_df[col] = processed_df[col].clip(lower=lower, upper=upper)

    processed_df.drop("loan_to_income_ratio", axis=1, inplace=True)

    for col in CATEGORICAL_COLUMNS:
        values = processed_df[col].astype(str)
        unknown_values = sorted(set(values) - set(artifacts.encoders[col].classes_))
        if unknown_values:
            raise ValueError(
                f"Unknown category values for {col}: {', '.join(unknown_values)}"
            )
        processed_df[col] = artifacts.encoders[col].transform(values)

    processed_df["net_worth"] = (
        processed_df["savings_assets"] - processed_df["current_debt"]
    )

    processed_df = processed_df[artifacts.feature_columns]
    return processed_df


def predict_records(records: list[dict], artifacts: LoadedArtifacts) -> list[PredictionResponse]:
    input_df = build_input_dataframe(records)
    processed_df = apply_inference_preprocessing(input_df, artifacts)

    model_input = processed_df
    if artifacts.uses_scaler:
        model_input = artifacts.scaler.transform(processed_df)

    predictions = artifacts.model.predict(model_input)
    probabilities = artifacts.model.predict_proba(model_input)

    outputs = []
    for prediction, probability in zip(predictions, probabilities):
        outputs.append(
            PredictionResponse(
                prediction="Approved" if int(prediction) == 1 else "Rejected",
                probability_approved=float(probability[1]),
                probability_rejected=float(probability[0]),
            )
        )

    return outputs
