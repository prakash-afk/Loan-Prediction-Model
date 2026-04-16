from pydantic import BaseModel


class PredictionResponse(BaseModel):
    prediction: str
    probability_approved: float
    probability_rejected: float


class BatchPredictionResponse(BaseModel):
    predictions: list[PredictionResponse]
