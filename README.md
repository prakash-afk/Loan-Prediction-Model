# Loan Prediction Model

An end-to-end loan approval prediction project that combines a machine learning training pipeline, a FastAPI inference service, and a React dashboard for single-record and batch scoring workflows.

The project trains multiple classification models on a structured loan dataset, selects the best performer by cross-validation, saves reusable artifacts, and serves predictions through a backend API. The current saved production artifact is an `XGBoost` classifier built from 18 engineered features.

## What This Project Does

- Trains and compares multiple loan approval classifiers.
- Applies repeatable preprocessing and feature engineering for both training and inference.
- Saves the best model, scaler, encoders, and feature metadata to disk.
- Exposes prediction endpoints through FastAPI.
- Supports an optional frontend dashboard for single-applicant and batch-applicant scoring.
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

### Frontend

- React
- Vite
- Framer Motion

## Project Structure

Current local workspace structure:

```text
Loan_Prediction_Model/
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
|-- main.py
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
- Exposes a health endpoint for frontend availability checks.

### API Endpoints

#### `GET /health`

Simple health probe used by the frontend.

Example response:

```json
{
  "status": "ok"
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
  "loan_to_income_ratio": 0.1667,
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

## Frontend Dashboard

This workspace also includes a Vite + React dashboard under `frontend/` for interactive scoring.

### Frontend Features

- Single prediction form with guided input validation
- Batch prediction table with row add / duplicate / delete actions
- Auto-calculated ratio fields:
  - `debt_to_income_ratio`
  - `loan_to_income_ratio`
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

### 2. Install Backend Dependencies

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

- Add automated tests for preprocessing and prediction endpoints.
- Store model metrics in versioned reports.
- Add request logging and model version metadata to API responses.
- Support CSV import/export for batch scoring.
- Containerize the backend and frontend for easier deployment.
