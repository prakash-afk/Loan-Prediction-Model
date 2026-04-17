import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { FIELD_META } from "../constants/formOptions";
import {
  buildSnapshotEntries,
  formatDisplayValue,
} from "../utils/formUtils";
import { HealthBadge } from "./HealthBadge";
import { LoadingState } from "./LoadingState";
import { ProbabilityBar } from "./ProbabilityBar";

const RISK_FACTOR_RULES = [
  {
    fieldName: "credit_score",
    strength: (value) => value >= 670,
    risk: (value) => value < 580,
  },
  {
    fieldName: "debt_to_income_ratio",
    strength: (value) => value < 0.3,
    risk: (value) => value >= 0.4,
  },
  {
    fieldName: "delinquencies_last_2yrs",
    strength: (value) => value === 0,
    risk: (value) => value >= 2,
  },
  {
    fieldName: "defaults_on_file",
    strength: (value) => value === 0,
    risk: (value) => value >= 1,
  },
  {
    fieldName: "payment_to_income_ratio",
    strength: (value) => value < 0.15,
    risk: (value) => value >= 0.25,
  },
  {
    fieldName: "annual_income",
    strength: (value) => value >= 60000,
    risk: () => false,
  },
];

function buildRiskFactorGroups(values) {
  if (!values) {
    return { strengths: [], risks: [] };
  }

  return RISK_FACTOR_RULES.reduce(
    (accumulator, rule) => {
      const rawValue = values[rule.fieldName];
      const numericValue = Number(rawValue);

      if (!Number.isFinite(numericValue)) {
        return accumulator;
      }

      const entry = {
        fieldName: rule.fieldName,
        label: FIELD_META[rule.fieldName].label,
        value: formatDisplayValue(rule.fieldName, rawValue),
      };

      if (rule.strength(numericValue)) {
        accumulator.strengths.push(entry);
      } else if (rule.risk(numericValue)) {
        accumulator.risks.push(entry);
      }

      return accumulator;
    },
    { strengths: [], risks: [] },
  );
}

function RiskFactorSummary({ values }) {
  const { strengths, risks } = buildRiskFactorGroups(values);

  if (strengths.length === 0 && risks.length === 0) {
    return null;
  }

  return (
    <section className="risk-summary">
      {strengths.length > 0 ? (
        <div className="risk-summary__group">
          <h3 className="risk-summary__title risk-summary__title--strength">
            {"\u2713"} Strong Factors
          </h3>
          <div className="risk-summary__chips">
            {strengths.map((entry, index) => (
              <div
                key={`strength-${entry.fieldName}`}
                className="risk-chip risk-chip--strength"
                style={{ "--chip-index": index }}
              >
                <span>{entry.label}</span>
                <strong>{entry.value}</strong>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {risks.length > 0 ? (
        <div className="risk-summary__group">
          <h3 className="risk-summary__title risk-summary__title--risk">
            {"\u26A0"} Risk Factors
          </h3>
          <div className="risk-summary__chips">
            {risks.map((entry, index) => (
              <div
                key={`risk-${entry.fieldName}`}
                className="risk-chip risk-chip--risk"
                style={{ "--chip-index": index }}
              >
                <span>{entry.label}</span>
                <strong>{entry.value}</strong>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

export function PredictionSummary({
  sectionRef,
  health,
  modeLabel,
  isLoading,
  result,
  errorMessage,
  lastSubmittedPayload,
  resultAnimationKey,
}) {
  const prefersReducedMotion = useReducedMotion();
  const snapshotEntries = lastSubmittedPayload
    ? buildSnapshotEntries(lastSubmittedPayload)
    : [];
  const resultCardVariants = prefersReducedMotion
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        hidden: {
          opacity: 0,
          y: 28,
          scale: 0.96,
          filter: "blur(10px)",
        },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          transition: {
            type: "spring",
            stiffness: 180,
            damping: 18,
            mass: 0.9,
            when: "beforeChildren",
            staggerChildren: 0.08,
          },
        },
        exit: {
          opacity: 0,
          y: -12,
          scale: 0.98,
          transition: { duration: 0.2, ease: "easeOut" },
        },
      };
  const resultItemVariants = prefersReducedMotion
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
      }
    : {
        hidden: { opacity: 0, y: 12 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.28, ease: "easeOut" },
        },
      };

  return (
    <aside ref={sectionRef} className="summary-surface">
      <div className="surface-header">
        <div>
          <p className="eyebrow">Live Prediction Panel</p>
          <h2 className="surface-title">{modeLabel}</h2>
          <p className="surface-subtitle">
            Inference, preprocessing, encoding, and column alignment stay in
            FastAPI so this UI only sends raw request values.
          </p>
        </div>

        <HealthBadge health={health} compact />
      </div>

      {errorMessage ? (
        <div className="panel-alert" role="alert">
          {errorMessage}
        </div>
      ) : null}

      <AnimatePresence mode="wait">
        {isLoading ? (
          <LoadingState
            key="summary-loading"
            title="Running prediction"
            description="Submitting the applicant record to FastAPI and waiting for the saved model response."
          />
        ) : result ? (
          <motion.div
            key={`summary-result-${resultAnimationKey}`}
            className="result-card result-card--animated"
            variants={resultCardVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="result-card__glow" aria-hidden="true" />
            <motion.div className="result-card__hero" variants={resultItemVariants}>
              <motion.div variants={resultItemVariants}>
                <p className="eyebrow">Decision</p>
                <div
                  className={`decision-badge decision-badge--pop ${
                    result.prediction === "Approved"
                      ? "decision-badge--approved"
                      : "decision-badge--rejected"
                  }`}
                >
                  {result.prediction}
                </div>
              </motion.div>

              <motion.div className="confidence-grid" variants={resultItemVariants}>
                <motion.div
                  className="confidence-card confidence-card--animated"
                  variants={resultItemVariants}
                >
                  <span>Approved</span>
                  <strong>
                    {(result.probability_approved * 100).toFixed(1)}%
                  </strong>
                </motion.div>
                <motion.div
                  className="confidence-card confidence-card--animated"
                  variants={resultItemVariants}
                >
                  <span>Rejected</span>
                  <strong>
                    {(result.probability_rejected * 100).toFixed(1)}%
                  </strong>
                </motion.div>
              </motion.div>
            </motion.div>

            <motion.div className="probability-stack" variants={resultItemVariants}>
              <ProbabilityBar
                label="Probability Approved"
                value={result.probability_approved}
                tone="approved"
                delayMs={0}
              />
              <ProbabilityBar
                label="Probability Rejected"
                value={result.probability_rejected}
                tone="rejected"
                delayMs={80}
              />
            </motion.div>

            <motion.div variants={resultItemVariants}>
              <RiskFactorSummary values={lastSubmittedPayload} />
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {snapshotEntries.length > 0 ? (
        <div className="snapshot-card">
          <div className="snapshot-card__header">
            <h3 className="section-card__title">Last valid submission</h3>
            <p className="section-card__description">
              Quick context for the most recent payload that was successfully
              sent to the backend.
            </p>
          </div>

          <div
            key={`snapshot-grid-${resultAnimationKey}`}
            className="chip-grid"
          >
            {snapshotEntries.map((entry, index) => (
              <div
                key={entry.fieldName}
                className={`snapshot-chip ${
                  result ? "snapshot-chip--animated" : ""
                }`}
                style={{ "--snapshot-delay": `${index * 30}ms` }}
              >
                <span>{entry.label}</span>
                <strong>{entry.value}</strong>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </aside>
  );
}
