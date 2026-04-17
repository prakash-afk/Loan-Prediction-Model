import { useReducedMotion } from "framer-motion";

export function ProbabilityBar({
  label,
  value,
  tone = "approved",
  delayMs = 0,
}) {
  const prefersReducedMotion = useReducedMotion();
  const percentage = Math.max(0, Math.min(100, value * 100));

  return (
    <div className="probability-bar">
      <div className="probability-bar__header">
        <span>{label}</span>
        <strong>{percentage.toFixed(1)}%</strong>
      </div>
      <div className="probability-bar__track">
        <span
          className={`probability-bar__fill probability-bar__fill--${tone} ${
            prefersReducedMotion ? "" : "probability-bar__fill--animate"
          }`}
          style={
            prefersReducedMotion
              ? { width: `${percentage}%` }
              : {
                  "--target-width": `${percentage}%`,
                  "--bar-delay": `${delayMs}ms`,
                }
          }
        />
      </div>
    </div>
  );
}
