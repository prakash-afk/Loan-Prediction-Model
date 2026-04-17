import { useReducedMotion } from "framer-motion";

import { HealthBadge } from "./HealthBadge";

const FEATURE_CHIPS = [
  "\u26A1 Instant Scoring",
  "\uD83D\uDCCA Single & Batch",
];

export function Header({ health }) {
  const prefersReducedMotion = useReducedMotion();
  const featureCount = health.featureCount || 18;
  const modelName = health.modelName || "XGBoost";
  const getAnimationStyle = (delay) =>
    prefersReducedMotion
      ? undefined
      : {
          animation: "fadeUp 560ms ease both",
          animationDelay: `${delay}ms`,
        };

  return (
    <header className="page-header">
      <div className="page-header__pattern" aria-hidden="true" />
      <div className="page-header__layout">
        <div className="page-header__copy">
          <p className="page-header__eyebrow" style={getAnimationStyle(0)}>
            LOAN APPROVAL SYSTEM
          </p>
          <h1 className="page-header__title" style={getAnimationStyle(80)}>
            Intelligent Credit Decision Engine
          </h1>
          <p className="page-header__subtitle" style={getAnimationStyle(160)}>
            Submit applicant data for instant ML-powered approval predictions
            with confidence scores
          </p>
          <div className="page-header__chips" style={getAnimationStyle(240)}>
            {[FEATURE_CHIPS[0], `\uD83C\uDFAF ${featureCount} Features`, FEATURE_CHIPS[1]].map((chip) => (
              <span key={chip} className="page-header__chip">
                {chip}
              </span>
            ))}
          </div>
        </div>

        <div className="page-header__badges" style={getAnimationStyle(300)}>
          <HealthBadge health={health} />
          <div className="page-header__model-badge">Model: {modelName}</div>
        </div>
      </div>
    </header>
  );
}
