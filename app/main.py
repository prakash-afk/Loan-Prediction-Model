import os
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

# Allow requests from local dev and dynamic Vercel frontend URL via FRONTEND_URL env var
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
if frontend_url and frontend_url not in origins:
    origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router)

if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port)

