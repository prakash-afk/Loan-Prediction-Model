from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.services.model_loader import load_model_artifacts


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.model_artifacts = load_model_artifacts()
    yield


app = FastAPI(title="Loan Prediction API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router)
