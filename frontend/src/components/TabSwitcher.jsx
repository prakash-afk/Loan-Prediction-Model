import { motion } from "framer-motion";

export function TabSwitcher({ tabs, activeTab, onTabChange }) {
  return (
    <div className="tab-switcher" role="tablist" aria-label="Prediction mode">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            className={`tab-switcher__button ${
              isActive ? "tab-switcher__button--active" : ""
            }`}
            onClick={() => onTabChange(tab.id)}
            role="tab"
            aria-selected={isActive}
          >
            {isActive ? (
              <motion.span
                className="tab-switcher__highlight"
                layoutId="active-tab-pill"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            ) : null}
            <span className="tab-switcher__label">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
