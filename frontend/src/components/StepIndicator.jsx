import { FIELD_GROUPS } from "../constants/fieldGroups";
import { validateFieldValue } from "../utils/formUtils";

function isGroupComplete(group, values) {
  return group.fields.every(
    (fieldName) => !validateFieldValue(fieldName, values[fieldName], values),
  );
}

export function StepIndicator({ values }) {
  const stepStates = FIELD_GROUPS.map((group) => ({
    ...group,
    complete: isGroupComplete(group, values),
  }));

  const firstIncompleteIndex = stepStates.findIndex((step) => !step.complete);

  return (
    <div className="step-indicator" aria-label="Form progress">
      {stepStates.map((step, index) => {
        const status = step.complete
          ? "complete"
          : index === firstIncompleteIndex
            ? "active"
            : "pending";

        return (
          <div key={step.key} className="step-indicator__item">
            <div className="step-indicator__visual">
              <div
                className={`step-indicator__circle step-indicator__circle--${status}`}
                aria-hidden="true"
              >
                {step.complete ? "\u2713" : index + 1}
              </div>

              {index < stepStates.length - 1 ? (
                <div className="step-indicator__line" aria-hidden="true">
                  <span
                    className={`step-indicator__line-fill ${
                      step.complete ? "step-indicator__line-fill--complete" : ""
                    }`}
                  />
                </div>
              ) : null}
            </div>

            <div className="step-indicator__copy">
              <span className="step-indicator__label">{step.title}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
