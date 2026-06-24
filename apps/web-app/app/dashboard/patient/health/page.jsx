// app/dashboard/patient/health/page.jsx
//
// Health profile — surfaces the clinical answers captured during onboarding
// (BMI inputs, weight history, GLP-1 history, conditions, lifestyle).
// Read-only; this is essentially the patient's view of what their doctor
// is about to see during the consultation.

"use client";

import { useAuthUser } from "@/lib/auth/useAuthUser";
import { formatIsoDateUs } from "@/lib/dates/usDate";
import styles from "../dashboard.module.css";

export default function PatientHealth() {
  const { profile } = useAuthUser();
  const onb = profile?.onboarding || {};

  const bmi = computeBmi(onb);
  const heightText = formatHeight(onb);
  const weightText = formatWeight(onb);

  return (
    <>
      <header className={styles.pageHeader}>
        <div>
          <div className={styles.kicker}>Patient · Health profile</div>
          <h1 className={styles.pageTitle}>Health profile</h1>
          <p className={styles.pageSubtitle}>
            What you shared with our care team during your intake.
          </p>
        </div>
      </header>

      <div className={styles.stack}>
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Body measurements</h2>
          </div>
          <InfoRow label="Height" value={heightText} />
          <InfoRow label="Current weight" value={weightText} />
          <InfoRow label="Heaviest weight" value={lbs(onb.wtHigh)} />
          <InfoRow label="Lowest adult weight" value={lbs(onb.wtLow)} />
          <InfoRow label="Goal weight" value={lbs(onb.wtGoal)} />
          <InfoRow label="Waist" value={onb.waist ? `${onb.waist} in` : "—"} />
          <InfoRow
            label="BMI"
            value={bmi != null ? bmi.toFixed(1) : "—"}
          />
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Weight loss journey</h2>
          </div>
          <InfoRow label="Amount you want to lose" value={onb.s1} />
          <TagsRow label="Top goals" values={onb.s2} />
          <InfoRow label="Years struggling" value={onb.s5} />
          <TagsRow label="Approaches tried" values={onb.s6} />
          {onb.s6Other && (
            <InfoRow label="Other approaches" value={onb.s6Other} />
          )}
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>GLP-1 history</h2>
          </div>
          <InfoRow label="Tried GLP-1 before" value={onb.s7} />
          <InfoRow label="Medication" value={onb.glpMed} />
          <InfoRow label="Most recent dose" value={onb.glpDose} />
          <InfoRow label="Dose details" value={onb.glpDoseDetails} />
          <InfoRow
            label="Last injection date"
            value={formatIsoDateUs(onb.glpLastInjection, onb.glpLastInjection)}
          />
          <InfoRow label="Experience" value={onb.glpExperience} />
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Medical history</h2>
          </div>
          <TagsRow label="Bariatric procedures" values={onb.s9} />
          <InfoRow
            label="Bariatric date"
            value={formatIsoDateUs(onb.bariDate, onb.bariDate)}
          />
          <TagsRow label="Diagnoses (cardio/metabolic)" values={onb.s10} />
          <TagsRow label="Other conditions" values={onb.s11} />
          {onb.s11Other && (
            <InfoRow label="Other conditions (notes)" value={onb.s11Other} />
          )}
          <TagsRow label="Safety flags" values={onb.s12} />
          <InfoRow label="Pregnant / planning" value={onb.s13} />
          <InfoRow label="Sexually active / contraception" value={onb.s14} />
          <InfoRow label="Other safety info" value={onb.s15} />
          <InfoRow label="Current medications" value={onb.meds} />
          <InfoRow label="Allergies" value={onb.allergies} />
          <InfoRow label="Preferred pharmacy" value={onb.pharmacy} />
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Lifestyle</h2>
          </div>
          <InfoRow label="Alcohol per week" value={onb.s16} />
          <TagsRow label="Substances" values={onb.s17} />
          {onb.s17Other && (
            <InfoRow label="Other substances" value={onb.s17Other} />
          )}
          <InfoRow label="Meals per day" value={onb.meals} />
          <InfoRow label="Workouts per week" value={onb.exercise} />
          <InfoRow label="Sleep (hrs)" value={onb.sleep} />
          <InfoRow label="Fast food per week" value={onb.fastFood} />
          <InfoRow label="Sugary drinks per week" value={onb.sugary} />
          <InfoRow label="Water per day" value={onb.water} />
          <InfoRow
            label="Stress level"
            value={typeof onb.stress === "number" ? `${onb.stress} / 10` : "—"}
          />
        </section>
      </div>
    </>
  );
}

function InfoRow({ label, value }) {
  const display =
    value === undefined || value === null || value === "" ? "—" : String(value);
  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      <span className={styles.rowValue}>{display}</span>
    </div>
  );
}

function TagsRow({ label, values }) {
  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      <span className={styles.rowValue} style={{ textAlign: "right" }}>
        {Array.isArray(values) && values.length > 0 ? (
          <span className={styles.tagList} style={{ justifyContent: "flex-end" }}>
            {values.map((v) => (
              <span key={v} className={styles.tag}>{v}</span>
            ))}
          </span>
        ) : (
          "—"
        )}
      </span>
    </div>
  );
}

function lbs(value) {
  if (!value) return "—";
  return `${value} lbs`;
}

function formatHeight(onb) {
  if (onb.bmiUnit === "metric") {
    return onb.heightCm ? `${onb.heightCm} cm` : "—";
  }
  if (!onb.heightFt && !onb.heightIn) return "—";
  return `${onb.heightFt || 0}' ${onb.heightIn || 0}"`;
}

function formatWeight(onb) {
  if (onb.bmiUnit === "metric") {
    return onb.weightKg ? `${onb.weightKg} kg` : "—";
  }
  return onb.weightLbs ? `${onb.weightLbs} lbs` : "—";
}

function computeBmi(onb) {
  if (onb?.bmiUnit === "metric") {
    const cm = parseFloat(onb.heightCm) || 0;
    const kg = parseFloat(onb.weightKg) || 0;
    if (cm <= 0 || kg <= 0) return null;
    const m = cm / 100;
    return kg / (m * m);
  }
  const feet = parseFloat(onb?.heightFt) || 0;
  const inches = parseFloat(onb?.heightIn) || 0;
  const pounds = parseFloat(onb?.weightLbs) || 0;
  if (feet <= 0 || pounds <= 0) return null;
  const total = feet * 12 + inches;
  if (total <= 0) return null;
  return (pounds * 703) / (total * total);
}
