// app/doctor/doctor-onboard/_components/Field.jsx
//
// Labeled form field with optional hint. Used inside every Section. Pure
// presentation. `hintTone="warn"` switches the hint to the warn color
// (used for failing-but-not-fatal validation messages).

import styles from "../doctor-onboard.module.css";

export default function Field({
  label,
  required,
  hint,
  hintTone,
  children,
}) {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>
        {label}
        {required && <span className={styles.required}> *</span>}
      </span>
      {children}
      {hint && (
        <span
          className={
            hintTone === "warn"
              ? `${styles.fieldHint} ${styles.fieldHintWarn}`
              : styles.fieldHint
          }
        >
          {hint}
        </span>
      )}
    </label>
  );
}
