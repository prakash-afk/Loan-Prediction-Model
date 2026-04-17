import {
  AUTO_CALCULATED_FIELDS,
  FIELD_METADATA,
  INTEGER_FIELDS,
  ORDERED_FIELDS,
  SNAPSHOT_FIELDS,
} from "../constants/formOptions";

const INTEGER_FIELD_SET = new Set(INTEGER_FIELDS);
const AUTO_CALCULATED_FIELD_SET = new Set(AUTO_CALCULATED_FIELDS);
const AUTO_CALCULATED_DEPENDENCIES = {
  debt_to_income_ratio: ["current_debt", "annual_income"],
  payment_to_income_ratio: ["loan_amount", "interest_rate", "annual_income"],
};
const RELATED_VALIDATION_FIELDS = {
  age: ["age", "years_employed", "credit_history_years"],
  years_employed: ["years_employed"],
  annual_income: [
    "annual_income",
    "debt_to_income_ratio",
    "payment_to_income_ratio",
  ],
  credit_score: ["credit_score"],
  credit_history_years: ["credit_history_years"],
  savings_assets: ["savings_assets"],
  current_debt: ["current_debt", "debt_to_income_ratio"],
  defaults_on_file: ["defaults_on_file"],
  delinquencies_last_2yrs: ["delinquencies_last_2yrs"],
  derogatory_marks: ["derogatory_marks"],
  product_type: ["product_type"],
  loan_intent: ["loan_intent"],
  loan_amount: ["loan_amount", "payment_to_income_ratio"],
  interest_rate: ["interest_rate", "payment_to_income_ratio"],
  debt_to_income_ratio: ["debt_to_income_ratio"],
  payment_to_income_ratio: ["payment_to_income_ratio"],
};
const ALLOWED_CONTROL_KEYS = new Set([
  "Backspace",
  "Delete",
  "Tab",
  "Enter",
  "Escape",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Home",
  "End",
]);
const RATIO_RISK_CONFIG = {
  debt_to_income_ratio: {
    shortLabel: "DTI",
    thresholds: [
      { max: 0.3, label: "Low Risk", tone: "low", icon: "\uD83D\uDFE2" },
      { max: 0.6, label: "Moderate Risk", tone: "moderate", icon: "\uD83D\uDFE1" },
      { max: Number.POSITIVE_INFINITY, label: "High Risk", tone: "high", icon: "\uD83D\uDD34" },
    ],
  },
  payment_to_income_ratio: {
    shortLabel: "PTI",
    thresholds: [
      { max: 0.3, label: "Low", tone: "low", icon: "\uD83D\uDFE2" },
      { max: 0.5, label: "Moderate", tone: "moderate", icon: "\uD83D\uDFE1" },
      { max: Number.POSITIVE_INFINITY, label: "Very High", tone: "high", icon: "\uD83D\uDD34" },
    ],
  },
};

export function buildEmptyFormValues() {
  return ORDERED_FIELDS.reduce((accumulator, fieldName) => {
    accumulator[fieldName] = "";
    return accumulator;
  }, {});
}

export function isValueEmpty(value) {
  return value === "" || value === null || value === undefined;
}

function normalizeStringValue(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function formatNumberForMessage(value) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}

function sanitizeIntegerInput(rawValue) {
  return normalizeStringValue(rawValue).replace(/[^\d]/g, "");
}

function sanitizeDecimalInput(rawValue) {
  const collapsed = normalizeStringValue(rawValue)
    .replace(/,/g, "")
    .replace(/[^\d.]/g, "");

  if (!collapsed) {
    return "";
  }

  const [whole = "", ...decimalParts] = collapsed.split(".");
  const decimalSection = decimalParts.join("");
  const normalizedWhole = whole === "" && collapsed.startsWith(".") ? "0" : whole;

  return decimalParts.length > 0
    ? `${normalizedWhole}.${decimalSection}`
    : normalizedWhole;
}

export function sanitizeFieldInput(fieldName, rawValue) {
  const metadata = FIELD_METADATA[fieldName];

  if (!metadata || metadata.type === "select") {
    return rawValue;
  }

  if (AUTO_CALCULATED_FIELD_SET.has(fieldName)) {
    return normalizeStringValue(rawValue);
  }

  return metadata.numericFormat === "integer"
    ? sanitizeIntegerInput(rawValue)
    : sanitizeDecimalInput(rawValue);
}

export function preventInvalidNumericKeyDown(event, fieldName, currentValue = "") {
  const metadata = FIELD_METADATA[fieldName];

  if (!metadata || metadata.type === "select" || AUTO_CALCULATED_FIELD_SET.has(fieldName)) {
    return;
  }

  if (event.ctrlKey || event.metaKey || ALLOWED_CONTROL_KEYS.has(event.key)) {
    return;
  }

  if (/^\d$/.test(event.key)) {
    return;
  }

  if (
    metadata.numericFormat !== "integer" &&
    event.key === "." &&
    !String(currentValue).includes(".")
  ) {
    return;
  }

  event.preventDefault();
}

export function getRevalidationFields(fieldName) {
  return RELATED_VALIDATION_FIELDS[fieldName] || [fieldName];
}

function isAgeValidForDependentChecks(ageValue) {
  return Number.isInteger(ageValue) && ageValue >= 18 && ageValue <= 75;
}

function areAutoCalculatedDependenciesReady(fieldName, values = {}) {
  const dependencies = AUTO_CALCULATED_DEPENDENCIES[fieldName] || [];

  return dependencies.every(
    (dependencyFieldName) => !isValueEmpty(values?.[dependencyFieldName]),
  );
}

function areAutoCalculatedDependenciesValid(fieldName, values = {}) {
  const dependencies = AUTO_CALCULATED_DEPENDENCIES[fieldName] || [];

  return dependencies.every(
    (dependencyFieldName) =>
      !validateFieldValue(
        dependencyFieldName,
        values?.[dependencyFieldName],
        values,
      ),
  );
}

function getCrossFieldValidationMessage(fieldName, numericValue, values) {
  const ageValue = Number(values.age);

  if (!isAgeValidForDependentChecks(ageValue)) {
    return "";
  }

  if (fieldName === "years_employed") {
    const maximumYearsEmployed = ageValue - 14;

    if (numericValue > maximumYearsEmployed) {
      return `Years employed cannot exceed ${formatNumberForMessage(maximumYearsEmployed)} based on the applicant's age.`;
    }
  }

  if (fieldName === "credit_history_years") {
    const maximumCreditHistory = ageValue - 18;

    if (numericValue > maximumCreditHistory) {
      return `Credit history years cannot exceed ${formatNumberForMessage(maximumCreditHistory)} based on the applicant's age.`;
    }
  }

  return "";
}

export function validateFieldValue(fieldName, value, values = {}) {
  const metadata = FIELD_METADATA[fieldName];

  if (!metadata) {
    return "";
  }

  const normalizedValue =
    typeof value === "string" ? value.trim() : value;

  if (
    AUTO_CALCULATED_FIELD_SET.has(fieldName) &&
    isValueEmpty(normalizedValue)
  ) {
    if (
      !areAutoCalculatedDependenciesReady(fieldName, values) ||
      !areAutoCalculatedDependenciesValid(fieldName, values)
    ) {
      return "";
    }
  }

  if (isValueEmpty(normalizedValue)) {
    return "This field is required.";
  }

  if (metadata.type === "select") {
    return metadata.options.includes(normalizedValue)
      ? ""
      : "Choose a valid option.";
  }

  const numericValue = Number(normalizedValue);

  if (!Number.isFinite(numericValue)) {
    return INTEGER_FIELD_SET.has(fieldName)
      ? metadata.integerMessage || `${metadata.label} must be a whole number.`
      : `${metadata.label} must be a valid number.`;
  }

  if (INTEGER_FIELD_SET.has(fieldName) && !Number.isInteger(numericValue)) {
    return metadata.integerMessage || `${metadata.label} must be a whole number.`;
  }

  if (metadata.nonNegative && numericValue < 0) {
    return metadata.nonNegativeMessage || `${metadata.label} cannot be negative.`;
  }

  if (metadata.positive && numericValue <= 0) {
    return metadata.positiveMessage || `${metadata.label} must be greater than 0.`;
  }

  if (metadata.min !== undefined && numericValue < metadata.min) {
    return metadata.minMessage || `${metadata.label} must be at least ${formatNumberForMessage(metadata.min)}.`;
  }

  if (metadata.max !== undefined && numericValue > metadata.max) {
    return metadata.maxMessage || `${metadata.label} must be no more than ${formatNumberForMessage(metadata.max)}.`;
  }

  return getCrossFieldValidationMessage(fieldName, numericValue, values);
}

export function validateFormValues(values) {
  return ORDERED_FIELDS.reduce((accumulator, fieldName) => {
    const errorMessage = validateFieldValue(fieldName, values[fieldName], values);

    if (errorMessage) {
      accumulator[fieldName] = errorMessage;
    }

    return accumulator;
  }, {});
}

export function getMissingFields(values) {
  return ORDERED_FIELDS.filter((fieldName) =>
    Boolean(validateFieldValue(fieldName, values[fieldName], values)),
  );
}

export function buildTouchedState() {
  return ORDERED_FIELDS.reduce((accumulator, fieldName) => {
    accumulator[fieldName] = true;
    return accumulator;
  }, {});
}

export function coerceFormValues(values) {
  return ORDERED_FIELDS.reduce((accumulator, fieldName) => {
    if (FIELD_METADATA[fieldName].type === "select") {
      accumulator[fieldName] = values[fieldName];
      return accumulator;
    }

    const normalizedValue = normalizeStringValue(values[fieldName]);
    accumulator[fieldName] = INTEGER_FIELD_SET.has(fieldName)
      ? Number.parseInt(normalizedValue, 10)
      : Number.parseFloat(normalizedValue);

    return accumulator;
  }, {});
}

export function getCompletionStats(values) {
  const validCount = ORDERED_FIELDS.length - getMissingFields(values).length;

  return {
    validCount,
    totalCount: ORDERED_FIELDS.length,
    percent: Math.round((validCount / ORDERED_FIELDS.length) * 100),
  };
}

function parseFiniteNumber(value) {
  if (value === "" || value === null || value === undefined) {
    return Number.NaN;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : Number.NaN;
}

function toCalculatedString(value) {
  return Number.isFinite(value) ? String(value) : "";
}

export function isAutoCalculatedField(fieldName) {
  return AUTO_CALCULATED_FIELD_SET.has(fieldName);
}

export function formatRatioDisplayValue(value) {
  if (value === "" || value === null || value === undefined) {
    return "\u2014";
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "\u2014";
  }

  return numericValue.toFixed(2);
}

export function getRiskLabel(type, value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const config = RATIO_RISK_CONFIG[type];
  const numericValue = Number(value);

  if (!config || !Number.isFinite(numericValue)) {
    return null;
  }

  const match =
    config.thresholds.find((threshold) => numericValue <= threshold.max) ||
    config.thresholds[config.thresholds.length - 1];
  const roundedValue = numericValue.toFixed(2);

  return {
    type,
    shortLabel: config.shortLabel,
    roundedValue,
    label: match.label,
    tone: match.tone,
    icon: match.icon,
    displayText: `${config.shortLabel}: ${roundedValue} ${match.icon} ${match.label}`,
  };
}

export function calculateAutoCalculatedValues(values) {
  const annualIncome = parseFiniteNumber(values.annual_income);
  const currentDebt = parseFiniteNumber(values.current_debt);
  const loanAmount = parseFiniteNumber(values.loan_amount);
  const interestRate = parseFiniteNumber(values.interest_rate);
  const hasPositiveAnnualIncome = Number.isFinite(annualIncome) && annualIncome > 0;

  return {
    debt_to_income_ratio:
      hasPositiveAnnualIncome && Number.isFinite(currentDebt)
        ? toCalculatedString(currentDebt / annualIncome)
        : "",
    payment_to_income_ratio:
      hasPositiveAnnualIncome &&
      Number.isFinite(loanAmount) &&
      Number.isFinite(interestRate)
        ? toCalculatedString((loanAmount * (interestRate / 100)) / annualIncome)
        : "",
  };
}

export function applyAutoCalculatedValues(values) {
  return {
    ...values,
    ...calculateAutoCalculatedValues(values),
  };
}

function formatNumericValue(value) {
  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return String(value);
  }

  if (Math.abs(numericValue) >= 1000) {
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 2,
    }).format(numericValue);
  }

  if (!Number.isInteger(numericValue)) {
    return numericValue.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
  }

  return String(numericValue);
}

export function formatDisplayValue(fieldName, value) {
  if (value === null || value === undefined || value === "") {
    return "\u2014";
  }

  if (FIELD_METADATA[fieldName]?.type === "select") {
    return value;
  }

  return formatNumericValue(value);
}

export function buildSnapshotEntries(values) {
  return SNAPSHOT_FIELDS.map((fieldName) => ({
    fieldName,
    label: FIELD_METADATA[fieldName].label,
    value: formatDisplayValue(fieldName, values[fieldName]),
  }));
}
