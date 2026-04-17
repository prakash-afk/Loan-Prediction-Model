import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRef, useState } from "react";

import { FIELD_METADATA, ORDERED_FIELDS } from "../constants/formOptions";
import { predictBatch } from "../services/api";
import {
  applyAutoCalculatedValues,
  buildEmptyFormValues,
  buildTouchedState,
  coerceFormValues,
  isAutoCalculatedField,
  validateFieldValue,
  validateFormValues,
} from "../utils/formUtils";
import { BatchResultsTable } from "./BatchResultsTable";
import { HealthBadge } from "./HealthBadge";

const AUTO_DEPENDENCY_FIELDS = new Set([
  "current_debt",
  "annual_income",
  "loan_amount",
  "interest_rate",
]);

function createRow(id, seedValues = {}) {
  return {
    id,
    values: applyAutoCalculatedValues({
      ...buildEmptyFormValues(),
      ...seedValues,
    }),
    touched: {},
    errors: {},
  };
}

function hasRowErrors(row) {
  return Object.keys(validateFormValues(row.values)).length > 0;
}

function applyValidation(row) {
  return {
    ...row,
    touched: buildTouchedState(),
    errors: validateFormValues(row.values),
  };
}

export function BatchTable({ health }) {
  const prefersReducedMotion = useReducedMotion();
  const nextRowId = useRef(2);
  const resultsRef = useRef(null);
  const [rows, setRows] = useState([createRow(1)]);
  const [results, setResults] = useState([]);
  const [submittedRows, setSubmittedRows] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const readyRows = rows.filter((row) => !hasRowErrors(row)).length;

  function updateRows(updater) {
    setRows((currentRows) => updater(currentRows));
  }

  function getFieldsToRevalidate(fieldName) {
    return AUTO_DEPENDENCY_FIELDS.has(fieldName)
      ? [
          fieldName,
          "debt_to_income_ratio",
          "loan_to_income_ratio",
          "payment_to_income_ratio",
        ]
      : [fieldName];
  }

  function handleCellChange(rowId, fieldName, nextValue) {
    const fieldsToRevalidate = getFieldsToRevalidate(fieldName);

    updateRows((currentRows) =>
      currentRows.map((row) => {
        if (row.id !== rowId) {
          return row;
        }

        const nextRow = {
          ...row,
          values: applyAutoCalculatedValues({
            ...row.values,
            [fieldName]: nextValue,
          }),
        };

        nextRow.errors = { ...row.errors };
        fieldsToRevalidate.forEach((name) => {
          if (row.touched[name]) {
            nextRow.errors[name] = validateFieldValue(
              name,
              nextRow.values[name],
            );
          }
        });

        return nextRow;
      }),
    );

    if (errorMessage) {
      setErrorMessage("");
    }
  }

  function handleCellBlur(rowId, fieldName) {
    const fieldsToRevalidate = getFieldsToRevalidate(fieldName);

    updateRows((currentRows) =>
      currentRows.map((row) => {
        if (row.id !== rowId) {
          return row;
        }

        return {
          ...row,
          touched: fieldsToRevalidate.reduce(
            (nextTouched, name) => {
              nextTouched[name] = true;
              return nextTouched;
            },
            { ...row.touched },
          ),
          errors: fieldsToRevalidate.reduce(
            (nextErrors, name) => {
              nextErrors[name] = validateFieldValue(name, row.values[name]);
              return nextErrors;
            },
            { ...row.errors },
          ),
        };
      }),
    );
  }

  function addRow() {
    const rowId = nextRowId.current;
    nextRowId.current += 1;
    updateRows((currentRows) => [...currentRows, createRow(rowId)]);
  }

  function duplicateRow(rowId) {
    const rowToDuplicate = rows.find((row) => row.id === rowId);

    if (!rowToDuplicate) {
      return;
    }

    const newRowId = nextRowId.current;
    nextRowId.current += 1;

    updateRows((currentRows) => [
      ...currentRows,
      createRow(newRowId, rowToDuplicate.values),
    ]);
  }

  function removeRow(rowId) {
    updateRows((currentRows) => {
      if (currentRows.length === 1) {
        return [createRow(currentRows[0].id)];
      }

      return currentRows.filter((row) => row.id !== rowId);
    });
  }

  function resetRows() {
    nextRowId.current = 2;
    setRows([createRow(1)]);
    setResults([]);
    setSubmittedRows([]);
    setErrorMessage("");
    setIsSubmitting(false);
  }

  function scrollToResults() {
    if (!resultsRef.current) {
      return;
    }

    const rect = resultsRef.current.getBoundingClientRect();
    const targetTop = window.scrollY + rect.top - 20;

    window.scrollTo({
      top: Math.max(0, targetTop),
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }

  async function handleSubmitBatch() {
    const validatedRows = rows.map((row) => applyValidation(row));
    const hasErrors = validatedRows.some(
      (row) => Object.keys(row.errors).length > 0,
    );

    setRows(validatedRows);

    if (hasErrors) {
      setErrorMessage("Please resolve the highlighted cells before submitting.");
      return;
    }

    const payload = validatedRows.map((row) => coerceFormValues(row.values));

    setIsSubmitting(true);
    setErrorMessage("");
    window.requestAnimationFrame(scrollToResults);

    try {
      const response = await predictBatch(payload);
      setResults(response.predictions);
      setSubmittedRows(payload);
    } catch (error) {
      if (Object.keys(error.fieldErrors || {}).length > 0) {
        updateRows((currentRows) =>
          currentRows.map((row, index) => {
            const nextErrors = { ...row.errors };
            const nextTouched = { ...row.touched };

            Object.entries(error.fieldErrors).forEach(([path, message]) => {
              const [rowIndex, fieldName] = path.split(".");

              if (Number.parseInt(rowIndex, 10) === index && fieldName) {
                nextErrors[fieldName] = message;
                nextTouched[fieldName] = true;
              }
            });

            return {
              ...row,
              errors: nextErrors,
              touched: nextTouched,
            };
          }),
        );
      }

      setResults([]);
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="batch-layout">
      <section className="batch-surface">
        <div className="surface-header">
          <div>
            <p className="eyebrow">Editable Animated Table</p>
            <h2 className="surface-title">Batch prediction workflow</h2>
            <p className="surface-subtitle">
              Add, duplicate, delete, and validate applicant rows before sending
              them to the batch prediction endpoint.
            </p>
          </div>

          <HealthBadge health={health} compact />
        </div>

        <div className="pill-row">
          <span className="pill">Rows: {rows.length}</span>
          <span className="pill">Ready: {readyRows}</span>
        </div>

        <div className="toolbar">
          <button type="button" className="button button--ghost" onClick={addRow}>
            Add Row
          </button>
          <button
            type="button"
            className="button button--ghost"
            onClick={resetRows}
            disabled={isSubmitting}
          >
            Reset
          </button>
          <button
            type="button"
            className="button button--primary"
            onClick={handleSubmitBatch}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="button__content">
                <span className="button-spinner" aria-hidden="true" />
                Submitting Batch
              </span>
            ) : (
              "Submit Batch"
            )}
          </button>
        </div>

        {errorMessage ? (
          <div className="panel-alert" role="alert">
            {errorMessage}
          </div>
        ) : null}

        <div className="grid-table">
          <div className="grid-table__header">
            <div className="grid-table__cell grid-table__cell--sticky">#</div>
            {ORDERED_FIELDS.map((fieldName) => (
              <div key={`header-${fieldName}`} className="grid-table__cell">
                {FIELD_METADATA[fieldName].label}
              </div>
            ))}
            <div className="grid-table__cell grid-table__cell--actions">
              Actions
            </div>
          </div>

          <AnimatePresence initial={false}>
            {rows.map((row, index) => (
              <motion.div
                key={row.id}
                className="grid-table__row"
                layout
                initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReducedMotion ? {} : { opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <div className="grid-table__cell grid-table__cell--sticky">
                  <span className="row-index">{index + 1}</span>
                </div>

                {ORDERED_FIELDS.map((fieldName) => {
                  const metadata = FIELD_METADATA[fieldName];
                  const fieldId = `batch-${row.id}-${fieldName}`;
                  const hasError = Boolean(
                    row.touched[fieldName] && row.errors[fieldName],
                  );
                  const autoCalculated = isAutoCalculatedField(fieldName);
                  const displayValue =
                    autoCalculated && row.values[fieldName] === ""
                      ? "\u2014"
                      : row.values[fieldName];

                  return (
                    <div
                      key={`${row.id}-${fieldName}`}
                      className={`grid-table__cell ${
                        hasError ? "grid-table__cell--invalid" : ""
                      }`}
                    >
                      {metadata.type === "select" ? (
                        <select
                          id={fieldId}
                          className="table-control"
                          value={row.values[fieldName]}
                          onChange={(event) =>
                            handleCellChange(row.id, fieldName, event.target.value)
                          }
                          onBlur={() => handleCellBlur(row.id, fieldName)}
                        >
                          <option value="">Select</option>
                          {metadata.options.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          id={fieldId}
                          className={`table-control ${
                            autoCalculated ? "table-control--readonly" : ""
                          }`}
                          type={autoCalculated ? "text" : "number"}
                          step={metadata.step}
                          min={metadata.min}
                          placeholder={metadata.placeholder}
                          value={displayValue}
                          readOnly={autoCalculated}
                          aria-readonly={autoCalculated}
                          onChange={
                            autoCalculated
                              ? undefined
                              : (event) =>
                                  handleCellChange(
                                    row.id,
                                    fieldName,
                                    event.target.value,
                                  )
                          }
                          onBlur={
                            autoCalculated
                              ? undefined
                              : () => handleCellBlur(row.id, fieldName)
                          }
                        />
                      )}

                      <div className="table-cell-meta">
                        <span className="table-cell-helper">
                          {hasError ? row.errors[fieldName] : metadata.helperText}
                        </span>
                        {autoCalculated ? (
                          <span className="table-auto-badge">Auto-calculated</span>
                        ) : null}
                      </div>
                    </div>
                  );
                })}

                <div className="grid-table__cell grid-table__cell--actions">
                  <div className="row-actions">
                    <button
                      type="button"
                      className="mini-button"
                      onClick={() => duplicateRow(row.id)}
                      disabled={isSubmitting}
                    >
                      Duplicate
                    </button>
                    <button
                      type="button"
                      className="mini-button mini-button--danger"
                      onClick={() => removeRow(row.id)}
                      disabled={isSubmitting}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </section>

      <BatchResultsTable
        sectionRef={resultsRef}
        health={health}
        results={results}
        submittedRows={submittedRows}
        isLoading={isSubmitting}
        errorMessage={errorMessage && results.length === 0 ? errorMessage : ""}
      />
    </div>
  );
}
