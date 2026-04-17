import {
  AUTO_CALCULATED_FIELDS,
  FIELD_METADATA,
  INTEGER_FIELDS,
  ORDERED_FIELDS,
  SNAPSHOT_FIELDS,
} from "../constants/formOptions";

const INTEGER_FIELD_SET = new Set(INTEGER_FIELDS);
const AUTO_CALCULATED_FIELD_SET = new Set(AUTO_CALCULATED_FIELDS);
const RATIO_RISK_CONFIG = {
  debt_to_income_ratio: {
    shortLabel: "DTI",
    thresholds: [
      { max: 0.3, label: "Low Risk", tone: "low", icon: "\uD83D\uDFE2" },
      { max: 0.6, label: "Moderate Risk", tone: "moderate", icon: "\uD83D\uDFE1" },
      { max: Number.POSITIVE_INFINITY, label: "High Risk", tone: "high", icon: "\uD83D\uDD34" },
    ],
  },
  loan_to_income_ratio: {
    shortLabel: "LTI",
    thresholds: [
      { max: 3, label: "Low", tone: "low", icon: "\uD83D\uDFE2" },
      { max: 6, label: "Moderate", tone: "moderate", icon: "\uD83D\uDFE1" },
      { max: Number.POSITIVE_INFINITY, label: "Very High", tone: "high", icon: "\uD83D\uDD34" },
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

export function validateFieldValue(fieldName, value) {
  const metadata = FIELD_METADATA[fieldName];

  if (!metadata) {
    return "";
  }

  if (isValueEmpty(value)) {
    return "This field is required.";
  }

  if (metadata.type === "select") {
    return metadata.options.includes(value) ? "" : "Choose a valid option.";
  }

  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return INTEGER_FIELD_SET.has(fieldName)
      ? "Enter a whole number."
      : "Enter a valid number.";
  }

  if (INTEGER_FIELD_SET.has(fieldName) && !Number.isInteger(numericValue)) {
    return "Enter a whole number.";
  }

  if (fieldName === "savings_assets" && numericValue < 0) {
    return "Savings assets cannot be negative.";
  }

  return "";
}

export function validateFormValues(values) {
  return ORDERED_FIELDS.reduce((accumulator, fieldName) => {
    const errorMessage = validateFieldValue(fieldName, values[fieldName]);

    if (errorMessage) {
      accumulator[fieldName] = errorMessage;
    }

    return accumulator;
  }, {});
}

export function getMissingFields(values) {
  return ORDERED_FIELDS.filter((fieldName) =>
    Boolean(validateFieldValue(fieldName, values[fieldName])),
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
    accumulator[fieldName] = INTEGER_FIELD_SET.has(fieldName)
      ? Number.parseInt(values[fieldName], 10)
      : Number.parseFloat(values[fieldName]);

    if (FIELD_METADATA[fieldName].type === "select") {
      accumulator[fieldName] = values[fieldName];
    }

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
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "\u2014";
  }

  return numericValue.toFixed(2);
}

export function getRiskLabel(type, value) {
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

  return {
    debt_to_income_ratio: toCalculatedString(currentDebt / annualIncome),
    loan_to_income_ratio: toCalculatedString(loanAmount / annualIncome),
    payment_to_income_ratio: toCalculatedString(
      (loanAmount * (interestRate / 100)) / annualIncome,
    ),
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
    return "—";
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
