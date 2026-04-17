import { motion, useReducedMotion } from "framer-motion";

const STATUS_CONFIG = {
  checking: {
    label: "Checking API",
    tone: "checking",
  },
  healthy: {
    label: "API Healthy",
    tone: "healthy",
  },
  degraded: {
    label: "API Responding",
    tone: "degraded",
  },
  offline: {
    label: "API Offline",
    tone: "offline",
  },
};

export function HealthBadge({ health, compact = false }) {
  const prefersReducedMotion = useReducedMotion();
  const config = STATUS_CONFIG[health.status] || STATUS_CONFIG.checking;

  return (
    <motion.div
      className={`health-badge health-badge--${config.tone} ${
        compact ? "health-badge--compact" : ""
      }`}
      animate={
        config.tone === "healthy" && !prefersReducedMotion
          ? {
              boxShadow: [
                "0 0 0 rgba(17, 138, 124, 0.1)",
                "0 0 0 10px rgba(17, 138, 124, 0)",
              ],
            }
          : {}
      }
      transition={
        config.tone === "healthy" && !prefersReducedMotion
          ? { duration: 1.8, repeat: Number.POSITIVE_INFINITY, ease: "easeOut" }
          : undefined
      }
    >
      <span className="health-badge__dot" />
      <div>
        <p className="health-badge__label">{config.label}</p>
        {health.error ? (
          <p className="health-badge__detail">{health.error}</p>
        ) : null}
      </div>
    </motion.div>
  );
}
