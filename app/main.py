from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.routes import router
from app.services.model_loader import load_model_artifacts


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.model_artifacts = load_model_artifacts()
    yield


app = FastAPI(title="Loan Prediction API", lifespan=lifespan)
app.include_router(router)
