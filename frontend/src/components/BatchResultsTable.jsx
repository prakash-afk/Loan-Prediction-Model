import { AnimatePresence, motion } from "framer-motion";

import { EmptyState } from "./EmptyState";
import { HealthBadge } from "./HealthBadge";
import { LoadingState } from "./LoadingState";

export function BatchResultsTable({
  sectionRef,
  health,
  results,
  submittedRows,
  isLoading,
  errorMessage,
}) {
  const approvedCount = results.filter(
    (item) => item.prediction === "Approved",
  ).length;
  const rejectedCount = results.length - approvedCount;

  return (
    <section ref={sectionRef} className="results-surface">
      <div className="surface-header">
        <div>
          <p className="eyebrow">Batch Results</p>
          <h2 className="surface-title">Aligned response output</h2>
          <p className="surface-subtitle">
            Predictions stay matched to row order so batch decisions can be
            reviewed against the submitted applicant details.
          </p>
        </div>

        <HealthBadge health={health} compact />
      </div>

      <div className="pill-row">
        <span className="pill">Mode: Batch</span>
        <span className="pill">Rows returned: {results.length}</span>
      </div>

      {results.length > 0 ? (
        <div className="summary-metrics">
          <div className="metric-card">
            <span>Total</span>
            <strong>{results.length}</strong>
          </div>
          <div className="metric-card">
            <span>Approved</span>
            <strong>{approvedCount}</strong>
          </div>
          <div className="metric-card">
            <span>Rejected</span>
            <strong>{rejectedCount}</strong>
          </div>
        </div>
      ) : null}

      {errorMessage ? (
        <div className="panel-alert" role="alert">
          {errorMessage}
        </div>
      ) : null}

      <AnimatePresence mode="wait">
        {isLoading ? (
          <LoadingState
            key="batch-loading"
            title="Scoring the batch"
            description="The API is processing all submitted applicant rows and will return an aligned prediction list."
          />
        ) : results.length > 0 ? (
          <motion.div
            key="batch-results"
            className="results-table__wrap"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <table className="results-table">
              <thead>
                <tr>
                  <th>Row</th>
                  <th>Applicant Snapshot</th>
                  <th>Prediction</th>
                  <th>Approved %</th>
                  <th>Rejected %</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result, index) => {
                  const snapshot = submittedRows[index];

                  return (
                    <motion.tr
                      key={`batch-result-${index}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03, duration: 0.18 }}
                    >
                      <td>{index + 1}</td>
                      <td>
                        <div className="result-snapshot">
                          <strong>{snapshot?.occupation_status || "—"}</strong>
                          <span>{snapshot?.loan_intent || "—"}</span>
                          <span>{snapshot?.product_type || "—"}</span>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`decision-badge ${
                            result.prediction === "Approved"
                              ? "decision-badge--approved"
                              : "decision-badge--rejected"
                          }`}
                        >
                          {result.prediction}
                        </span>
                      </td>
                      <td>{(result.probability_approved * 100).toFixed(1)}%</td>
                      <td>{(result.probability_rejected * 100).toFixed(1)}%</td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </motion.div>
        ) : (
          <EmptyState
            key="batch-empty"
            title="Batch predictions will collect here"
            description="Add one or more applicant rows, submit the batch, and this panel will populate the returned decisions."
          />
        )}
      </AnimatePresence>
    </section>
  );
}
