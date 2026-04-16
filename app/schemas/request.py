from pydantic import BaseModel, ConfigDict, Field


class ApplicantRequest(BaseModel):
    age: int
    occupation_status: str
    years_employed: float
    annual_income: float
    credit_score: int
    credit_history_years: float
    savings_assets: float = Field(ge=0)
    current_debt: float
    defaults_on_file: int
    delinquencies_last_2yrs: int
    derogatory_marks: int
    product_type: str
    loan_intent: str
    loan_amount: float
    interest_rate: float
    debt_to_income_ratio: float
    loan_to_income_ratio: float
    payment_to_income_ratio: float

    model_config = ConfigDict(extra="forbid")
