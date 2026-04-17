import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { FIELD_GROUPS } from "../constants/fieldGroups";
import { FIELD_METADATA } from "../constants/formOptions";
import { predictOne } from "../services/api";
import {
  applyAutoCalculatedValues,
  buildEmptyFormValues,
  buildTouchedState,
  coerceFormValues,
  formatRatioDisplayValue,
  getRiskLabel,
  isAutoCalculatedField,
  validateFieldValue,
  validateFormValues,
} from "../utils/formUtils";
import { FormSection } from "./FormSection";
import { PredictionSummary } from "./PredictionSummary";
import { StepIndicator } from "./StepIndicator";

const AUTO_DEPENDENCY_FIELDS = new Set([
  "current_debt",
  "annual_income",
  "loan_amount",
  "interest_rate",
]);

function mapSingleFieldErrors(fieldErrors) {
  return Object.entries(fieldErrors || {}).reduce(
    (accumulator, [path, message]) => {
      const [fieldName] = path.split(".");

      if (fieldName) {
        accumulator[fieldName] = message;
      }

      return accumulator;
    },
    {},
  );
}

function buildInitialValues() {
  return applyAutoCalculatedValues(buildEmptyFormValues());
}

function isGroupComplete(group, values) {
  return group.fields.every(
    (fieldName) => !validateFieldValue(fieldName, values[fieldName]),
  );
}

export function SinglePredictionForm({
  health,
}) {
  const prefersReducedMotion = useReducedMotion();
  const shakeTimeoutRef = useRef(null);
  const summaryRef = useRef(null);
  const pendingSummaryScrollRef = useRef(false);
  const [values, setValues] = useState(buildInitialValues);
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isButtonShaking, setIsButtonShaking] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [lastSubmittedPayload, setLastSubmittedPayload] = useState(null);
  const [resultAnimationKey, setResultAnimationKey] = useState(0);
  const [unlockedGroupCount, setUnlockedGroupCount] = useState(1);

  const formHasErrors = Object.keys(validateFormValues(values)).length > 0;
  const showSummary = isSubmitting || Boolean(result) || Boolean(lastSubmittedPayload);
  const stepStates = FIELD_GROUPS.map((group) => ({
    ...group,
    complete: isGroupComplete(group, values),
  }));
  const firstIncompleteIndex = stepStates.findIndex((group) => !group.complete);
  const activeGroupIndex =
    firstIncompleteIndex === -1 ? stepStates.length - 1 : firstIncompleteIndex;
  const visibleGroups = stepStates.slice(
    0,
    Math.max(unlockedGroupCount, activeGroupIndex + 1),
  );

  useEffect(() => {
    return () => {
      if (shakeTimeoutRef.current) {
        window.clearTimeout(shakeTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setUnlockedGroupCount((currentCount) =>
      Math.max(currentCount, activeGroupIndex + 1),
    );
  }, [activeGroupIndex]);

  useEffect(() => {
    if (!pendingSummaryScrollRef.current || !summaryRef.current || !isSubmitting) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      const rect = summaryRef.current.getBoundingClientRect();
      const targetTop = window.scrollY + rect.top - 20;

      window.scrollTo({
        top: Math.max(0, targetTop),
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });

      pendingSummaryScrollRef.current = false;
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [isSubmitting, prefersReducedMotion]);

  function triggerButtonShake() {
    if (shakeTimeoutRef.current) {
      window.clearTimeout(shakeTimeoutRef.current);
    }

    setIsButtonShaking(true);
    shakeTimeoutRef.current = window.setTimeout(() => {
      setIsButtonShaking(false);
    }, 400);
  }

  function getFieldsToRevalidate(fieldName) {
    return AUTO_DEPENDENCY_FIELDS.has(fieldName)
      ? [fieldName, "debt_to_income_ratio", "loan_to_income_ratio", "payment_to_income_ratio"]
      : [fieldName];
  }

  function buildNextValues(fieldName, nextValue) {
    return applyAutoCalculatedValues({
      ...values,
      [fieldName]: nextValue,
    });
  }

  function handleFieldChange(fieldName, nextValue) {
    const nextValues = buildNextValues(fieldName, nextValue);
    const fieldsToRevalidate = getFieldsToRevalidate(fieldName);

    setValues(nextValues);

    setErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };

      fieldsToRevalidate.forEach((name) => {
        if (touched[name]) {
          nextErrors[name] = validateFieldValue(name, nextValues[name]);
        }
      });

      return nextErrors;
    });

    if (errorMessage) {
      setErrorMessage("");
    }
  }

  function handleFieldBlur(fieldName) {
    const fieldsToRevalidate = getFieldsToRevalidate(fieldName);

    setTouched((currentTouched) => {
      const nextTouched = { ...currentTouched };
      fieldsToRevalidate.forEach((name) => {
        nextTouched[name] = true;
      });
      return nextTouched;
    });

    setErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      fieldsToRevalidate.forEach((name) => {
        nextErrors[name] = validateFieldValue(name, values[name]);
      });
      return nextErrors;
    });
  }

  async function submitPrediction() {
    const validationErrors = validateFormValues(values);

    if (Object.keys(validationErrors).length > 0) {
      pendingSummaryScrollRef.current = false;
      setErrors(validationErrors);
      setTouched(buildTouchedState());
      setErrorMessage("Please resolve the highlighted fields before submitting.");
      return;
    }

    const payload = coerceFormValues(values);

    pendingSummaryScrollRef.current = true;
    setIsSubmitting(true);
    setErrorMessage("");
    setResult(null);

    try {
      const prediction = await predictOne(payload);
      setResult(prediction);
      setLastSubmittedPayload(payload);
      setResultAnimationKey((currentKey) => currentKey + 1);
    } catch (error) {
      const backendFieldErrors = mapSingleFieldErrors(error.fieldErrors);

      if (Object.keys(backendFieldErrors).length > 0) {
        setErrors((currentErrors) => ({
          ...currentErrors,
          ...backendFieldErrors,
        }));
        setTouched(buildTouchedState());
      }

      setResult(null);
      setErrorMessage(error.message);
      triggerButtonShake();
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    submitPrediction();
  }

  function handleReset() {
    pendingSummaryScrollRef.current = false;
    setValues(buildInitialValues());
    setTouched({});
    setErrors({});
    setIsSubmitting(false);
    setIsButtonShaking(false);
    setResult(null);
    setErrorMessage("");
    setLastSubmittedPayload(null);
    setResultAnimationKey(0);
    setUnlockedGroupCount(1);
  }

  function renderPredictButton(extraClassName = "") {
    return (
      <button
        type="button"
        className={`button button--primary button--predict ${
          isSubmitting ? "is-loading" : ""
        } ${isButtonShaking ? "shake" : ""} ${extraClassName}`.trim()}
        onClick={submitPrediction}
        disabled={isSubmitting || formHasErrors}
      >
        <span className="button__stack">
          <span className="button__text">Predict</span>
          <span className="button__loading">
            <span className="button-spinner" aria-hidden="true" />
            Predicting
          </span>
        </span>
      </button>
    );
  }

  function renderField(fieldName) {
    const metadata = FIELD_METADATA[fieldName];
    const fieldId = `single-${fieldName}`;
    const hasError = Boolean(touched[fieldName] && errors[fieldName]);
    const autoCalculated = isAutoCalculatedField(fieldName);
    const riskLabel = autoCalculated ? getRiskLabel(fieldName, values[fieldName]) : null;
    const displayValue =
      autoCalculated
        ? formatRatioDisplayValue(values[fieldName])
        : values[fieldName];

    return (
      <div
        key={fieldName}
        className={`field-card ${hasError ? "field-card--invalid" : ""} ${
          autoCalculated ? "field-card--auto" : ""
        }`}
      >
        <label className="field-card__label" htmlFor={fieldId}>
          {metadata.label}
        </label>

        {metadata.type === "select" ? (
          <select
            id={fieldId}
            className="field-card__control"
            value={values[fieldName]}
            onChange={(event) => handleFieldChange(fieldName, event.target.value)}
            onBlur={() => handleFieldBlur(fieldName)}
          >
            <option value="">Select an option</option>
            {metadata.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ) : (
          <input
            id={fieldId}
            className={`field-card__control ${
              autoCalculated ? "field-card__control--readonly" : ""
            }`}
            type={autoCalculated ? "text" : "number"}
            inputMode={metadata.inputMode}
            placeholder={metadata.placeholder}
            step={metadata.step}
            min={metadata.min}
            value={displayValue}
            readOnly={autoCalculated}
            aria-readonly={autoCalculated}
            onChange={
              autoCalculated
                ? undefined
                : (event) => handleFieldChange(fieldName, event.target.value)
            }
            onBlur={autoCalculated ? undefined : () => handleFieldBlur(fieldName)}
          />
        )}

        <div className="field-card__footer">
          <AnimatePresence mode="wait">
            {hasError ? (
              <motion.p
                key="field-error"
                className="field-card__message field-card__message--error"
                initial={prefersReducedMotion ? false : { opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReducedMotion ? {} : { opacity: 0, y: -4 }}
                transition={{ duration: 0.16 }}
              >
                {errors[fieldName]}
              </motion.p>
            ) : (
              <motion.p
                key="field-helper"
                className="field-card__message"
                initial={prefersReducedMotion ? false : { opacity: 0.6 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.16 }}
              >
                {metadata.helperText}
              </motion.p>
            )}
          </AnimatePresence>

          {autoCalculated ? (
            <div className="field-card__meta-row">
              {riskLabel ? (
                <span
                  className={`ratio-risk-badge ratio-risk-badge--${riskLabel.tone}`}
                >
                  {riskLabel.displayText}
                </span>
              ) : null}
              <span className="auto-badge">Auto-calculated</span>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`single-layout ${
        showSummary ? "single-layout--with-summary" : "single-layout--form-only"
      }`}
    >
      <form className="form-surface" onSubmit={handleSubmit}>
          <div className="surface-header">
          <div>
            <p className="eyebrow">Animated Applicant Form</p>
            <h2 className="surface-title">Single prediction workflow</h2>
            <p className="surface-subtitle">
              Complete every required value, then submit a single applicant
              record to the FastAPI model endpoint.
            </p>
          </div>
        </div>

        <StepIndicator values={values} />

        <div className="form-section-stage">
          <div className="form-section-stack">
            {visibleGroups.map((group) => (
              <FormSection
                key={group.key}
                title={group.title}
                description={group.description}
                accentColor={group.accentColor}
                borderLeft={group.borderLeft}
              >
                <div className="field-grid">
                  {group.fields.map((fieldName) => renderField(fieldName))}
                </div>
              </FormSection>
            ))}
          </div>

          <div
            className={`form-loading-overlay ${
              isSubmitting ? "form-loading-overlay--visible" : ""
            }`}
            aria-hidden="true"
          />
        </div>

        {errorMessage ? (
          <div className="panel-alert" role="alert">
            {errorMessage}
          </div>
        ) : null}

        <div className="form-actions">
          <button
            type="button"
            className="button button--ghost"
            onClick={handleReset}
            disabled={isSubmitting}
          >
            Reset
          </button>

          {renderPredictButton()}
        </div>
      </form>

      {showSummary ? (
        <PredictionSummary
          sectionRef={summaryRef}
          health={health}
          modeLabel="Single Prediction"
          isLoading={isSubmitting}
          result={result}
          errorMessage={errorMessage}
          lastSubmittedPayload={lastSubmittedPayload}
          resultAnimationKey={resultAnimationKey}
        />
      ) : null}

      <div className="mobile-action-bar">
        <button
          type="button"
          className="button button--ghost"
          onClick={handleReset}
          disabled={isSubmitting}
        >
          Reset
        </button>
        {renderPredictButton("mobile-action-bar__predict")}
      </div>
    </div>
  );
}
