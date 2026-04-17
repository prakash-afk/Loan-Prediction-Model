import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

import { BatchTable } from "./components/BatchTable";
import { Header } from "./components/Header";
import { SinglePredictionForm } from "./components/SinglePredictionForm";
import { TabSwitcher } from "./components/TabSwitcher";
import { getHealth } from "./services/api";

const TABS = [
  { id: "single", label: "Single Prediction" },
  { id: "batch", label: "Batch Prediction" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("single");
  const [health, setHealth] = useState({
    loading: true,
    status: "checking",
    error: "",
    modelName: "XGBoost",
    featureCount: 18,
  });
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    let isMounted = true;

    async function loadHealth() {
      if (isMounted) {
        setHealth((currentHealth) => ({
          ...currentHealth,
          loading: true,
        }));
      }

      try {
        const response = await getHealth();

        if (!isMounted) {
          return;
        }

        setHealth({
          loading: false,
          status: response.status === "ok" ? "healthy" : "degraded",
          error: "",
          modelName: response.model_name || "XGBoost",
          featureCount: response.feature_count || 18,
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setHealth((currentHealth) => ({
          loading: false,
          status: "offline",
          error: error.message,
          modelName: currentHealth.modelName,
          featureCount: currentHealth.featureCount,
        }));
      }
    }

    loadHealth();
    const intervalId = window.setInterval(loadHealth, 30000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const panelAnimation = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -12 },
        transition: { duration: 0.24, ease: "easeOut" },
      };

  return (
    <div className="app-shell">
      <Header health={health} />

      <motion.main
        className="dashboard"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
        animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <div className="dashboard__topbar">
          <div>
            <p className="eyebrow">Interactive Dashboard</p>
            <h2 className="dashboard__title">Saved-model applicant scoring</h2>
            <p className="dashboard__subtitle">
              Use the exact FastAPI request schema for guided single or batch
              prediction workflows.
            </p>
          </div>

          <TabSwitcher
            tabs={TABS}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "single" ? (
            <motion.section
              key="single-panel"
              className="dashboard__panel"
              {...panelAnimation}
            >
              <SinglePredictionForm health={health} />
            </motion.section>
          ) : (
            <motion.section
              key="batch-panel"
              className="dashboard__panel"
              {...panelAnimation}
            >
              <BatchTable health={health} />
            </motion.section>
          )}
        </AnimatePresence>
      </motion.main>
    </div>
  );
}
