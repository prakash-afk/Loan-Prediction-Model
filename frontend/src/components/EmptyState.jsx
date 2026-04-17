import { motion } from "framer-motion";

export function EmptyState({ title, description }) {
  return (
    <motion.div
      className="state-card state-card--empty"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <div className="state-card__icon">○</div>
      <h3 className="state-card__title">{title}</h3>
      <p className="state-card__description">{description}</p>
    </motion.div>
  );
}
