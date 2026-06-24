// app/doctor/doctor-onboard/_components/Section.jsx
//
// Numbered section header + body slot used by every doctor-onboard
// section. Pure presentation — no state.

import styles from "../doctor-onboard.module.css";

export default function Section({ number, title, description, children }) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        {number != null && number !== "" ? (
          <span className={styles.sectionNum}>{number}</span>
        ) : null}
        <div>
          <h2 className={styles.sectionTitle}>{title}</h2>
          {description && <p className={styles.sectionDesc}>{description}</p>}
        </div>
      </div>
      <div className={styles.sectionBody}>{children}</div>
    </section>
  );
}
