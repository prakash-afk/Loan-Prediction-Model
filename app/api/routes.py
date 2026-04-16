from fastapi import APIRouter, HTTPException, Request

from app.schemas.request import ApplicantRequest
from app.schemas.response import BatchPredictionResponse, PredictionResponse
from app.services.prediction_service import predict_records

router = APIRouter()


@router.get("/health")
def health():
    return {"status": "ok"}


@router.post("/predict", response_model=PredictionResponse)
def predict(payload: ApplicantRequest, request: Request):
    try:
        prediction = predict_records(
            [payload.model_dump()],
            request.app.state.model_artifacts,
        )[0]
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error

    return prediction


@router.post("/predict/batch", response_model=BatchPredictionResponse)
def predict_batch(payload: list[ApplicantRequest], request: Request):
    try:
        predictions = predict_records(
            [item.model_dump() for item in payload],
            request.app.state.model_artifacts,
        )
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error

    return BatchPredictionResponse(predictions=predictions)
