import { motion, useReducedMotion } from "framer-motion";

export function FormSection({
  title,
  description,
  children,
  accentColor,
  borderLeft,
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.section
      className="section-card"
      style={{
        borderLeft,
        "--section-accent": accentColor || "var(--accent)",
      }}
      whileHover={
        prefersReducedMotion
          ? undefined
          : {
              y: -4,
              boxShadow: "0 22px 60px rgba(17, 32, 62, 0.13)",
            }
      }
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <div className="section-card__header">
        <h3 className="section-card__title">{title}</h3>
        <p className="section-card__description">{description}</p>
      </div>

      <div className="section-card__content">{children}</div>
    </motion.section>
  );
}
