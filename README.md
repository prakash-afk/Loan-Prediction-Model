# Loan Approval Prediction Model

An end-to-end loan approval prediction project that combines a machine learning training pipeline, a FastAPI inference service, and a React dashboard for single-record and batch scoring workflows.

The project trains multiple classification models on a structured loan dataset, selects the best performer by cross-validation, saves reusable artifacts, and serves predictions through a backend API. The current saved production artifact is an `XGBoost` classifier built from 18 engineered features.

## 🚀 Live Demo

| Service | URL | Platform |
|---|---|---|
| 🌐 **Frontend Dashboard** | [loan-prediction-model-sigma.vercel.app](https://loan-prediction-model-sigma.vercel.app) | Vercel |
| ⚙️ **Backend API** | [loan-prediction-backend-latest.onrender.com](https://loan-prediction-backend-latest.onrender.com) | Render |
| 📖 **API Docs (Swagger)** | [loan-prediction-backend-latest.onrender.com/docs](https://loan-prediction-backend-latest.onrender.com/docs) | Render |

> **Note:** The backend runs on Render's free tier and may take up to 50 seconds to wake up after a period of inactivity.

## What This Project Does

- Trains and compares multiple loan approval classifiers.
- Applies repeatable preprocessing and feature engineering for both training and inference.
- Saves the best model, scaler, encoders, and feature metadata to disk.
- Exposes prediction endpoints through FastAPI.
- Includes comprehensive automated API integration tests (pytest) and Selenium UI tests.
- Uses GitHub Actions for automated CI/CD testing on PRs and pushes to `master` and `feature/test-automation`.
- Supports an interactive React dashboard for single-applicant and batch-applicant scoring.
- Supports health checks so the frontend can detect whether the backend is available.

## Workflow Overview

```text
dataset.csv
  -> cleaning + preprocessing
  -> feature engineering
  -> model training + cross-validation
  -> best model selection
  -> artifact export
  -> FastAPI loads artifacts on startup
  -> GitHub Actions runs automated tests on PRs
  -> frontend submits single or batch applicant records
  -> API returns approval decision + class probabilities
```

## Tech Stack

### Backend / ML

- Python
- pandas, numpy
- scikit-learn
- XGBoost
- joblib
- FastAPI
- Uvicorn

### Testing & CI

- pytest
- requests
- Selenium WebDriver
- GitHub Actions CI

### Frontend

- React
- Vite
- Framer Motion

## Project Structure

Current local workspace structure:

```text
Loan_Prediction_Model/
|-- .github/
|   `-- workflows/
|       `-- tests.yml
|-- app/
|   |-- api/
|   |-- core/
|   |-- schemas/
|   `-- services/
|-- artifacts/
|   |-- best_model.pkl
|   |-- encoders.pkl
|   |-- feature_columns.json
|   `-- scaler.pkl
|-- data/
|   `-- dataset.csv
|-- frontend/
|   |-- src/
|   |   |-- components/
|   |   |-- constants/
|   |   |-- services/
|   |   `-- utils/
|   |-- package.json
|   `-- vite.config.js
|-- ml/
|   |-- data/
|   |-- features/
|   |-- models/
|   |-- utils/
|   `-- visualization/
|-- notebooks/
|   `-- eda.ipynb
|-- tests/
|   |-- api/
|   |   |-- conftest.py
|   |   |-- test_health.py
|   |   |-- test_predict.py
|   |   `-- test_predict_batch.py
|   `-- ui/
|       |-- conftest.py
|       |-- test_batch_prediction.py
|       `-- test_single_prediction.py
|-- main.py
|-- pytest.ini
|-- requirements.txt
`-- README.md
```

## Dataset

The training pipeline expects the dataset at `data/dataset.csv`.

Current local dataset characteristics:

- Rows: `50,000`
- Target column: `loan_status`
- Raw columns: `20`
- The `data/` directory is ignored by git, so each environment needs its own dataset copy.

Raw dataset columns:

- `customer_id`
- `age`
- `occupation_status`
- `years_employed`
- `annual_income`
- `credit_score`
- `credit_history_years`
- `savings_assets`
- `current_debt`
- `defaults_on_file`
- `delinquencies_last_2yrs`
- `derogatory_marks`
- `product_type`
- `loan_intent`
- `loan_amount`
- `interest_rate`
- `debt_to_income_ratio`
- `loan_to_income_ratio`
- `payment_to_income_ratio`
- `loan_status`

## Machine Learning Pipeline

The training entry point is `main.py`.

### Models Trained

Baseline models:

- Logistic Regression
- Decision Tree
- Random Forest
- Gradient Boosting

Additional tuned models:

- Random Forest Tuned
- Gradient Boosting Tuned

Boosting model:

- XGBoost

### Model Selection Logic

The best model is selected by the highest `cv_mean` value across all trained models, not just test accuracy. That keeps model selection closer to generalization performance instead of a single split.

### Saved Artifacts

The training script writes reusable inference artifacts to `artifacts/`:

- `best_model.pkl`: serialized winning model
- `scaler.pkl`: fitted scaler used for inference when required
- `encoders.pkl`: label encoders, capping bounds, model metadata
- `feature_columns.json`: exact feature order expected at inference time

## FastAPI Backend

The API application lives under `app/` and loads model artifacts during startup.

### Backend Features

- Loads trained artifacts once at app startup.
- Rejects requests that contain unexpected fields.
- Rejects unseen categorical values for encoded string columns.
- Supports both single and batch predictions.
- Returns prediction label plus approval/rejection probabilities.
- Exposes a health endpoint displaying model metadata and feature count.

### API Endpoints

#### `GET /health`

Health probe used by the frontend and CI environment checks.

Example response:

```json
{
  "status": "ok",
  "model_name": "XGBoost",
  "feature_count": 18
}
```

#### `POST /predict`

Scores one applicant and returns a single prediction object.

Example request body:

```json
{
  "age": 34,
  "occupation_status": "Employed",
  "years_employed": 7.5,
  "annual_income": 72000,
  "credit_score": 710,
  "credit_history_years": 10.2,
  "savings_assets": 18000,
  "current_debt": 9500,
  "defaults_on_file": 0,
  "delinquencies_last_2yrs": 1,
  "derogatory_marks": 0,
  "product_type": "Personal Loan",
  "loan_intent": "Home Improvement",
  "loan_amount": 12000,
  "interest_rate": 11.5,
  "debt_to_income_ratio": 0.1319,
  "payment_to_income_ratio": 0.0192
}
```

Example response:

```json
{
  "prediction": "Approved",
  "probability_approved": 0.84,
  "probability_rejected": 0.16
}
```

#### `POST /predict/batch`

Scores a list of applicants and returns an array of prediction objects.

Example response shape:

```json
{
  "predictions": [
    {
      "prediction": "Approved",
      "probability_approved": 0.84,
      "probability_rejected": 0.16
    },
    {
      "prediction": "Rejected",
      "probability_approved": 0.21,
      "probability_rejected": 0.79
    }
  ]
}
```

## Testing & CI/CD Pipeline

This project includes automated testing for both the backend API and frontend UI, integrated with GitHub Actions.

### Running API Tests Locally

Ensure the FastAPI server is running (`http://127.0.0.1:8000`), then run pytest:

```powershell
.\.venv\Scripts\python.exe -m pytest tests/api/ -v
```

To run smoke tests only:

```powershell
.\.venv\Scripts\python.exe -m pytest tests/api/ -m smoke -v
```

### Running Selenium UI Tests Locally

With both the backend (`http://127.0.0.1:8000`) and React frontend (`http://127.0.0.1:5173`) running:

```powershell
.\.venv\Scripts\python.exe -m pytest tests/ui/ -v
```

### GitHub Actions CI

The `.github/workflows/tests.yml` pipeline automatically triggers on:
- Pushes to `master` and `feature/test-automation` branches.
- Pull Requests targeting `master` and `feature/test-automation` branches.

The workflow boots an Ubuntu runner, starts FastAPI in the background, waits for health check readiness, and executes the pytest API test suite.

## Frontend Dashboard

This workspace also includes a Vite + React dashboard under `frontend/` for interactive scoring.

### Frontend Features

- Single prediction form with guided input validation
- Batch prediction table with row add / duplicate / delete actions
- Auto-calculated ratio fields:
  - `debt_to_income_ratio`
  - `payment_to_income_ratio`
- Backend health status polling every 30 seconds
- Animated transitions and loading states
- Result summaries for both single and batch submissions

### Frontend Environment Variable

Create `frontend/.env.local` and set:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

An example file is already included at `frontend/.env.example`.

## Setup Instructions

### Prerequisites

- Python 3.10+ recommended
- Node.js 18+ recommended for the frontend
- A local copy of `data/dataset.csv`

### 1. Create And Activate A Virtual Environment

If you do not already have one:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

### 2. Install Backend & Testing Dependencies

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

### 3. Install Frontend Dependencies

If you are using the local frontend dashboard:

```powershell
cd frontend
npm install
cd ..
```

### Run The FastAPI Server

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

Default backend URL:

- `http://127.0.0.1:8000`

### Run The Frontend

If the `frontend/` folder is part of your checkout:

```powershell
cd frontend
Copy-Item .env.example .env.local
npm run dev
```

Default frontend URL:

- `http://127.0.0.1:5173`

## Future Improvements

- [x] Add automated tests for preprocessing and prediction endpoints.
- [x] Add GitHub Actions CI workflow for pull request test execution.
- [x] Containerize the backend with Docker and deploy to Render.
- [x] Deploy frontend to Vercel with production environment configuration.
- [ ] Store model metrics in versioned reports.
- [ ] Add request logging and model version metadata to API responses.
- [ ] Support CSV import/export for batch scoring.
