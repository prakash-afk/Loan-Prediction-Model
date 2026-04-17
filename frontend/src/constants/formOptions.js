export const OCCUPATION_OPTIONS = [
  "Employed",
  "Self-Employed",
  "Student",
];

export const PRODUCT_TYPE_OPTIONS = [
  "Credit Card",
  "Line of Credit",
  "Personal Loan",
];

export const LOAN_INTENT_OPTIONS = [
  "Business",
  "Debt Consolidation",
  "Education",
  "Home Improvement",
  "Medical",
  "Personal",
];

export const ORDERED_FIELDS = [
  "age",
  "occupation_status",
  "years_employed",
  "annual_income",
  "credit_score",
  "credit_history_years",
  "savings_assets",
  "current_debt",
  "defaults_on_file",
  "delinquencies_last_2yrs",
  "derogatory_marks",
  "product_type",
  "loan_intent",
  "loan_amount",
  "interest_rate",
  "debt_to_income_ratio",
  "loan_to_income_ratio",
  "payment_to_income_ratio",
];

export const INTEGER_FIELDS = [
  "age",
  "credit_score",
  "defaults_on_file",
  "delinquencies_last_2yrs",
  "derogatory_marks",
];

export const AUTO_CALCULATED_FIELDS = [
  "debt_to_income_ratio",
  "loan_to_income_ratio",
  "payment_to_income_ratio",
];

export const SNAPSHOT_FIELDS = [
  "occupation_status",
  "annual_income",
  "credit_score",
  "product_type",
  "loan_intent",
  "loan_amount",
];

export const FIELD_META = {
  age: {
    label: "Age",
    type: "number",
    step: "1",
    inputMode: "numeric",
    placeholder: "35",
    helperText: "Whole years at the time of the application.",
  },
  occupation_status: {
    label: "Occupation Status",
    type: "select",
    options: OCCUPATION_OPTIONS,
    helperText: "Use the exact employment category expected by the API.",
  },
  years_employed: {
    label: "Years Employed",
    type: "number",
    step: "0.1",
    inputMode: "decimal",
    placeholder: "8.5",
    helperText: "Decimal years are allowed if that matches your source data.",
  },
  annual_income: {
    label: "Annual Income",
    type: "number",
    step: "0.01",
    inputMode: "decimal",
    placeholder: "72000",
    helperText: "Provide the raw income value used for scoring.",
  },
  credit_score: {
    label: "Credit Score",
    type: "number",
    step: "1",
    inputMode: "numeric",
    placeholder: "710",
    helperText: "Whole-number credit score input.",
  },
  credit_history_years: {
    label: "Credit History Years",
    type: "number",
    step: "0.1",
    inputMode: "decimal",
    placeholder: "11.2",
    helperText: "Credit history length in years.",
  },
  savings_assets: {
    label: "Savings Assets",
    type: "number",
    step: "0.01",
    min: "0",
    inputMode: "decimal",
    placeholder: "18000",
    helperText: "Cannot be negative because the API enforces a minimum of 0.",
  },
  current_debt: {
    label: "Current Debt",
    type: "number",
    step: "0.01",
    inputMode: "decimal",
    placeholder: "9500",
    helperText: "Outstanding debt before the requested loan is applied.",
  },
  defaults_on_file: {
    label: "Defaults On File",
    type: "number",
    step: "1",
    inputMode: "numeric",
    placeholder: "0",
    helperText: "Enter the exact count currently on file.",
  },
  delinquencies_last_2yrs: {
    label: "Delinquencies Last 2 Years",
    type: "number",
    step: "1",
    inputMode: "numeric",
    placeholder: "1",
    helperText: "Whole-number delinquency count for the last two years.",
  },
  derogatory_marks: {
    label: "Derogatory Marks",
    type: "number",
    step: "1",
    inputMode: "numeric",
    placeholder: "0",
    helperText: "Whole-number derogatory mark count.",
  },
  product_type: {
    label: "Product Type",
    type: "select",
    options: PRODUCT_TYPE_OPTIONS,
    helperText: "Select one of the dataset-backed lending products.",
  },
  loan_intent: {
    label: "Loan Intent",
    type: "select",
    options: LOAN_INTENT_OPTIONS,
    helperText: "Choose the exact stated reason for the loan request.",
  },
  loan_amount: {
    label: "Loan Amount",
    type: "number",
    step: "0.01",
    inputMode: "decimal",
    placeholder: "12000",
    helperText: "Requested principal amount.",
  },
  interest_rate: {
    label: "Interest Rate",
    type: "number",
    step: "0.01",
    inputMode: "decimal",
    placeholder: "11.5",
    helperText: "Enter the rate value exactly as expected by the model.",
  },
  debt_to_income_ratio: {
    label: "Debt To Income Ratio",
    type: "number",
    step: "0.0001",
    inputMode: "decimal",
    placeholder: "0.28",
    helperText: "Ratio fields should be sent as raw numeric values, not text.",
    isAutoCalculated: true,
  },
  loan_to_income_ratio: {
    label: "Loan To Income Ratio",
    type: "number",
    step: "0.0001",
    inputMode: "decimal",
    placeholder: "0.16",
    helperText: "Keep the same ratio form used during notebook training.",
    isAutoCalculated: true,
  },
  payment_to_income_ratio: {
    label: "Payment To Income Ratio",
    type: "number",
    step: "0.0001",
    inputMode: "decimal",
    placeholder: "0.08",
    helperText: "Use the raw ratio value before any display formatting.",
    isAutoCalculated: true,
  },
};

export const FIELD_METADATA = FIELD_META;
