import admin from "../admin.module.css";

export default function AdminFormField({
  label,
  required,
  hint,
  hintTone,
  children,
}) {
  return (
    <div className={admin.modalField}>
      <span className={admin.modalLabel}>
        {label}
        {required && <span className={admin.modalRequired}> *</span>}
      </span>
      {children}
      {hint && (
        <span
          className={
            hintTone === "warn" ? admin.modalHintWarn : admin.modalHint
          }
        >
          {hint}
        </span>
      )}
    </div>
  );
}
