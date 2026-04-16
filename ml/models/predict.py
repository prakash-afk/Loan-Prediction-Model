import pandas as pd


def create_sample_applicants():
    sample_applicants = pd.DataFrame({
        "age": [42, 35, 24, 50, 29],
        "years_employed": [12, 6, 1, 20, 3],
        "annual_income": [180000, 85000, 32000, 140000, 50000],
        "credit_score": [780, 670, 480, 820, 560],
        "credit_history_years": [15, 8, 2, 22, 4],
        "savings_assets": [90000, 30000, 5000, 120000, 10000],
        "current_debt": [15000, 25000, 18000, 10000, 30000],
        "defaults_on_file": [0, 0, 1, 0, 0],
        "delinquencies_last_2yrs": [0, 1, 3, 0, 2],
        "has_derog": [0, 0, 1, 0, 0],
        "occupation_status": [2, 1, 0, 2, 1],
        "product_type": [1, 0, 2, 1, 0],
        "loan_intent": [0, 2, 1, 3, 4],
        "loan_amount": [40000, 25000, 18000, 50000, 22000],
        "interest_rate": [9.5, 12.8, 18.5, 8.2, 15.6],
        "debt_to_income_ratio": [0.18, 0.32, 0.58, 0.12, 0.45],
        "payment_to_income_ratio": [0.11, 0.24, 0.41, 0.09, 0.33]
    })

    sample_applicants["net_worth"] = (
        sample_applicants["savings_assets"] - sample_applicants["current_debt"]
    )

    applicant_names = [
        "Applicant A - Strong Profile",
        "Applicant B - Moderate Risk",
        "Applicant C - High Risk",
        "Applicant D - Premium Borrower",
        "Applicant E - Borderline Case"
    ]

    print("Sample applicants created.")
    print(sample_applicants)
    return sample_applicants, applicant_names


def predict_sample_applicants(sample_applicants, applicant_names, X_train, xgb_result):
    sample_applicants = sample_applicants[X_train.columns]

    final_name = "XGBoost"
    final_model = xgb_result[final_name]["model"]

    predictions = final_model.predict(sample_applicants)
    probabilities = final_model.predict_proba(sample_applicants)

    prob_approved = [f"{p[1] * 100:.1f}%" for p in probabilities]
    prob_rejected = [f"{p[0] * 100:.1f}%" for p in probabilities]
    decision = ["APPROVED" if p == 1 else "REJECTED" for p in predictions]

    results_df = pd.DataFrame({
        "Applicant": applicant_names,
        "Annual Income": [f"{v:,}" for v in sample_applicants["annual_income"]],
        "Loan Amount": [f"{v:,}" for v in sample_applicants["loan_amount"]],
        "Credit Score": sample_applicants["credit_score"].values,
        "Debt-to-Income Ratio": sample_applicants["debt_to_income_ratio"].values,
        "Prob Approved": prob_approved,
        "Prob Rejected": prob_rejected,
        "Decision": decision
    })

    def color_decision(val):
        if val == "APPROVED":
            return "background-color: #2EC4B6; color: white; font-weight: bold; text-align: center"
        else:
            return "background-color: #E71D36; color: white; font-weight: bold; text-align: center"

    def color_credit(val):
        if val >= 750:
            return "background-color: #c8f7c5; color: #1a7a16; font-weight: bold"
        elif val >= 600:
            return "background-color: #fff3cd; color: #856404; font-weight: bold"
        else:
            return "background-color: #ffd6d6; color: #b30000; font-weight: bold"

    styled = (
        results_df.style
        .map(color_decision, subset=["Decision"])
        .map(color_credit, subset=["Credit Score"])
        .set_table_styles([
            {"selector": "thead th",
             "props": [("background-color", "#4361EE"),
                       ("color", "white"),
                       ("font-size", "13px"),
                       ("text-align", "center"),
                       ("padding", "10px")]},
            {"selector": "tbody td",
             "props": [("text-align", "center"),
                       ("padding", "9px"),
                       ("font-size", "12px")]},
            {"selector": "tbody tr:nth-child(even)",
             "props": [("background-color", "#f5f5f5")]}
        ])
        .set_caption("Loan Approval Prediction Results - Sample Applicants")
        .hide(axis="index")
    )

    print(results_df)
    return results_df, styled
