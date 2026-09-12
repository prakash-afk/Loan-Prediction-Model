from pydantic import BaseModel, ConfigDict, Field, model_validator


class ApplicantRequest(BaseModel):
    age: int = Field(ge=18, le=75)
    occupation_status: str
    years_employed: float = Field(ge=0, le=50)
    annual_income: float = Field(gt=0, le=10_000_000)
    credit_score: int = Field(ge=300, le=900)
    credit_history_years: float = Field(ge=0)
    savings_assets: float = Field(ge=0, le=10_000_000)
    current_debt: float = Field(ge=0, le=10_000_000)
    defaults_on_file: int = Field(ge=0, le=20)
    delinquencies_last_2yrs: int = Field(ge=0, le=50)
    derogatory_marks: int = Field(ge=0, le=20)
    product_type: str
    loan_intent: str
    loan_amount: float = Field(ge=1, le=10_000_000)
    interest_rate: float = Field(ge=0, le=100)
    debt_to_income_ratio: float = Field(ge=0)
    payment_to_income_ratio: float = Field(ge=0)

    model_config = ConfigDict(extra="forbid")

    @model_validator(mode="after")
    def validate_cross_field_rules(self):
        if self.years_employed > self.age - 14:
            raise ValueError("Years employed cannot exceed age minus 14.")

        if self.credit_history_years > self.age - 18:
            raise ValueError("Credit history years cannot exceed age minus 18.")

        return self
