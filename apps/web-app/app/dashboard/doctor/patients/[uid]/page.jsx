// app/dashboard/doctor/patients/[uid]/page.jsx
//
// Patient deep-dive for the doctor. Pulls users/{uid} + the doctor's
// appointments with this patient via /api/doctor/patients/[uid] and lays
// every captured field out in clinically useful groupings.

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuthUser } from "@/lib/auth/useAuthUser";
import { auth } from "@/lib/firebase/auth";
import { formatPhoneDisplay } from "@/lib/phone/usPhone";
import { formatIsoDateUs, formatUsDate } from "@/lib/dates/usDate";
import { formatPatientDob } from "@/lib/prescriptions/format";
import { useDoctorDashboardBase } from "../../useDoctorBase";
import PrescriptionPanel from "@/components/doctor/PrescriptionPanel";
import { computeBmiFromOnboarding } from "@/lib/prescriptions/bmi";
import styles from "../../../patient/dashboard.module.css";
import local from "./detail.module.css";
import { throwIfApiFailed, userErrorMessage } from "@/lib/ui/userErrorMessage";
import {
  formatOnboardingFieldLabel,
  formatOnboardingFieldValue,
  isOnboardingFieldEmpty,
} from "@/lib/onboarding/displayFields";

export default function PatientDetailPage() {
  const { uid } = useParams();
  const doctorBase = useDoctorDashboardBase();
  const { user, profile } = useAuthUser();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || !uid) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const idToken = await auth.currentUser?.getIdToken();
        const res = await fetch(`/api/doctor/patients/${uid}`, {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        const data = await res.json();
        if (cancelled) return;
        throwIfApiFailed(data, "load");
        setPatient(data.patient);
      } catch (e) {
        if (!cancelled) setError(userErrorMessage(e, "load"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, uid]);

  if (loading) {
    return (
      <section className={styles.card}>
        <p style={{ color: "var(--color-text-muted)", margin: 0 }}>Loading patient…</p>
      </section>
    );
  }
  if (error || !patient) {
    return (
      <section className={styles.card}>
        <p style={{ color: "#b45309", margin: 0 }}>
          {error || "Patient not found."}
        </p>
        <Link href={`${doctorBase}/patients`} className={styles.ctaSecondary} style={{ marginTop: 12 }}>
          ← Back to patients
        </Link>
      </section>
    );
  }

  const onb = patient.onboarding || {};
  const bmi = computeBmiFromOnboarding(onb);
  const age = computeAge(patient.dob);
  const appointments = patient.appointments || [];
  const statusBadge = appointmentStatusBadge(appointments);
  const issuedPrescription = resolveIssuedPrescription(appointments);
  return (
    <>
      <Link href={`${doctorBase}/patients`} className={local.backLink}>
        ← Back to patients
      </Link>

      {/* ===== Header card ===== */}
      <section className={local.headerCard}>
        <div className={local.headerInner}>
          <div className={local.headerAvatar}>
            {(patient.firstName?.[0] || patient.fullName?.[0] || "?").toUpperCase()}
          </div>
          <div className={local.headerInfo}>
            <h1 className={local.headerName}>{patient.fullName}</h1>
            <div className={local.headerMeta}>
              <span>{age != null ? `${age} years old` : "Age unknown"}</span>
              {onb.sexAtBirth && <span>· {capitalize(onb.sexAtBirth)}</span>}
              {patient.dob && <span>· DOB {formatPatientDob(patient.dob)}</span>}
            </div>
            <div className={local.contactRow}>
              {patient.email && (
                <span className={local.contactChip}>
                  ✉ {patient.email}
                </span>
              )}
              {patient.phone && (
                <span className={local.contactChip}>
                  ☎ {formatPhoneDisplay(patient.phone)}
                </span>
              )}
              {onb.zip && (
                <span className={local.contactChip}>📍 ZIP {onb.zip}</span>
              )}
            </div>
          </div>
          <div className={local.headerStatus}>
            <span className={`${styles.pill} ${statusBadge.pillClass}`}>
              {statusBadge.label}
            </span>
          </div>
        </div>
      </section>

      {/* ===== Stat tiles ===== */}
      <div className={styles.statRow}>
        <StatTile
          tone="coral"
          label="BMI"
          value={bmi != null ? bmi.toFixed(1) : "—"}
          sub={bmi != null ? bmiCategory(bmi) : "Not enough data"}
        />
        <StatTile
          tone="slate"
          label="Current weight"
          value={
            onb.weightLbs ? `${onb.weightLbs} lbs` : onb.weightKg ? `${onb.weightKg} kg` : "—"
          }
          sub={onb.heightFt ? `${onb.heightFt}'${onb.heightIn || 0}"` : onb.heightCm ? `${onb.heightCm} cm` : ""}
        />
        <StatTile
          tone="green"
          label="Goal weight"
          value={onb.wtGoal ? `${onb.wtGoal} lbs` : "—"}
          sub={
            onb.weightLbs && onb.wtGoal
              ? `${Math.max(0, Number(onb.weightLbs) - Number(onb.wtGoal))} lbs to lose`
              : ""
          }
        />
      </div>

      <PrescriptionPanel
        mode="record"
        patient={patient}
        doctorProfile={profile}
        bmi={bmi}
        savedPrescriptionText={issuedPrescription.prescriptionText}
        savedSignatureUrl={issuedPrescription.prescriptionSignatureURL}
        initialPrescriptionType={issuedPrescription.prescriptionType}
        initialMedicationId={issuedPrescription.prescriptionMedicationId}
        initialStrengthId={issuedPrescription.prescriptionStrengthId}
      />

      {/* ===== Two-column body ===== */}
      <div className={styles.colSplit}>
        <div className={styles.stack}>
          {/* Medications */}
          <Card eyebrow="Medications & allergies" title="Current pharmacology">
            <Row label="Current medications" value={onb.meds} multiline />
            <Row label="Allergies" value={onb.allergies} multiline />
            <Row label="Preferred pharmacy" value={onb.pharmacy} />
          </Card>

          {/* GLP-1 history */}
          <Card eyebrow="GLP-1 history" title="Prior treatment exposure">
            <Row label="Has used a GLP-1 before" value={onb.s7} />
            <Row label="Specific experience" value={onb.glpExperience} />
            <Row label="Medication tried" value={onb.glpMed} />
            <Row label="Dose" value={onb.glpDose} />
            <Row label="Dose details" value={onb.glpDoseDetails} multiline />
            <Row
              label="Last injection"
              value={formatIsoDateUs(onb.glpLastInjection, onb.glpLastInjection)}
            />
          </Card>

          {/* Medical history */}
          <Card eyebrow="Medical history" title="Conditions & safety screen">
            <Row label="Chronic conditions" value={onb.s10} />
            <Row label="Other conditions" value={onb.s11} />
            <Row label="Other conditions (detail)" value={onb.s11Other} multiline />
            <Row label="Contraindication risks" value={onb.s12} />
            <Row label="Hospitalizations" value={onb.s13} />
            <Row label="Pregnancy / lactation" value={onb.s14} />
            <Row label="Pregnancy consent" value={onb.pregnancyConsent ? "Yes" : "—"} />
            <Row label="Family history" value={onb.s15} />
            <Row label="Bariatric history" value={onb.s9} />
            <Row
              label="Bariatric procedure date"
              value={formatIsoDateUs(onb.bariDate, onb.bariDate)}
            />
          </Card>
        </div>

        <div className={styles.stack}>
          {/* Account snapshot */}
          <Card eyebrow="Account" title="Profile & consents">
            <Row label="Email" value={patient.email} />
            <Row
              label="Email verified"
              value={
                patient.emailVerified ? (
                  <span className={`${styles.pill} ${styles.pillOk}`}>Yes</span>
                ) : (
                  <span className={`${styles.pill} ${styles.pillWarn}`}>No</span>
                )
              }
            />
            <Row label="Phone" value={formatPhoneDisplay(patient.phone) || "—"} />
            <Row label="DOB" value={formatPatientDob(patient.dob)} />
            <Row label="ZIP" value={onb.zip} />
            <Row label="Address" value={onb.address} multiline />
            <Row label="Sex at birth" value={onb.sexAtBirth} />
            <Row label="HIPAA consent" value={patient.consentHIPAA ? "Signed" : "—"} />
            <Row label="Telehealth consent" value={patient.consentTelehealth ? "Signed" : "—"} />
            <Row label="Registered" value={formatUsDate(patient.createdAtMs)} />
          </Card>

          {/* Lifestyle */}
          <Card eyebrow="Lifestyle" title="Day-to-day habits">
            <Row label="Meals per day" value={onb.meals} />
            <Row label="Exercise" value={onb.exercise} />
            <Row label="Sleep" value={onb.sleep} />
            <Row label="Fast food / week" value={onb.fastFood} />
            <Row label="Sugary drinks / week" value={onb.sugary} />
            <Row label="Water / day" value={onb.water} />
            <Row label="Stress (1–10)" value={onb.stress} />
            <Row label="Exercise routine" value={onb.s16} />
            <Row label="Eating habits" value={onb.s17} />
            <Row label="Other eating habits" value={onb.s17Other} multiline />
            <Row label="Goals & barriers" value={onb.s19} />
          </Card>

          {/* Outreach notes — static until wired to comms */}
          <Card eyebrow="Outreach" title="Contact notes">
            <Row
              label="If call not answered"
              value="Email / text / SMS outreach (not logged yet)"
              multiline
            />
          </Card>
        </div>
      </div>

      {/* ===== Appointments ===== */}
      <Card eyebrow="Visits" title="Appointments with you" style={{ marginTop: 16 }}>
        {patient.appointments?.length ? (
          <div className={local.apptList}>
            {patient.appointments.map((a) => (
              <div key={a.id} className={local.appt}>
                <div className={local.apptWhen}>
                  <div className={local.apptDate}>
                    {formatIsoDateUs(a.date)}
                  </div>
                  <div className={local.apptTime}>{formatIsoTime(a.time)}</div>
                </div>
                <div className={local.apptBody}>
                  <div className={local.apptType}>{a.type || "Consultation"}</div>
                  {a.status === "cancelled" ? (
                    <>
                      <div className={local.apptCancelLabel}>Cancellation reason</div>
                      <div className={local.apptCancelRemark}>
                        {a.cancelRemark?.trim() || "No reason provided."}
                      </div>
                    </>
                  ) : a.notes ? (
                    <div className={local.apptNotes}>{a.notes}</div>
                  ) : (
                    <div className={local.apptNotesEmpty}>No notes yet.</div>
                  )}
                </div>
                <span
                  className={`${styles.pill} ${
                    a.status === "completed"
                      ? styles.pillOk
                      : a.status === "cancelled"
                        ? styles.pillWarn
                        : styles.pillNeutral
                  }`}
                >
                  {capitalize(a.status)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: "var(--color-text-muted)", margin: 0 }}>
            No appointments on the books yet.
          </p>
        )}
      </Card>

      {/* ===== Raw onboarding dump ===== */}
      <details className={local.rawDump}>
        <summary>Full onboarding response</summary>
        <div className={local.rawTable}>
          {Object.entries(onb)
            .filter(([, v]) => !isOnboardingFieldEmpty(v))
            .map(([k, v]) => (
              <div key={k} className={local.rawRow}>
                <span className={local.rawKey}>{formatOnboardingFieldLabel(k)}</span>
                <span className={local.rawVal}>
                  {formatOnboardingFieldValue(k, v, {
                    currency: onb.paymentCurrency || "usd",
                  })}
                </span>
              </div>
            ))}
        </div>
      </details>
    </>
  );
}

/* ─── Components ─────────────────────────────────────────────────────── */

function Card({ eyebrow, title, children, style }) {
  return (
    <section className={styles.card} style={style}>
      <div className={styles.cardEyebrow}>{eyebrow}</div>
      <h2 className={styles.cardTitle}>{title}</h2>
      <div style={{ marginTop: 6 }}>{children}</div>
    </section>
  );
}

function Row({ label, value, multiline, mono }) {
  const display = stringifyValue(value);
  if (!display) return null;
  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      <span
        className={styles.rowValue}
        style={{
          ...(multiline ? { whiteSpace: "pre-wrap" } : {}),
          ...(mono ? { fontFamily: 'var(--font-site)', fontSize: 12 } : {}),
          textAlign: "right",
          maxWidth: "60%",
        }}
      >
        {typeof value === "string" || typeof value === "number" ? display : value}
      </span>
    </div>
  );
}

function StatTile({ tone, label, value, sub }) {
  const toneClass =
    {
      green: styles.statIconGreen,
      coral: styles.statIconCoral,
      slate: styles.statIconSlate,
      amber: styles.statIconAmber,
    }[tone] || styles.statIconSlate;
  return (
    <div className={styles.stat}>
      <div className={`${styles.statIcon} ${toneClass}`} aria-hidden />
      <div className={styles.statBody}>
        <div className={styles.statLabel}>{label}</div>
        <div className={styles.statValue}>{value}</div>
        <div className={styles.statSub}>{sub}</div>
      </div>
    </div>
  );
}

/* ─── Helpers ────────────────────────────────────────────────────────── */

function stringifyValue(v) {
  if (v == null || v === "") return "";
  if (Array.isArray(v)) return v.filter(Boolean).join(", ");
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "object") {
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }
  return String(v);
}

function computeAge(dob) {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

function bmiCategory(bmi) {
  if (bmi == null) return "—";
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Healthy";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

function formatIsoTime(hhmm) {
  if (!hhmm || !/^\d{2}:\d{2}$/.test(hhmm)) return hhmm || "";
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

function capitalize(s) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function parseAppointmentMs(date, time) {
  if (!date || !time || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    return null;
  }
  const [y, m, d] = date.split("-").map(Number);
  const [h, min] = time.split(":").map(Number);
  const ms = new Date(y, m - 1, d, h, min).getTime();
  return Number.isNaN(ms) ? null : ms;
}

/** Latest visit status for the header badge (replaces onboarded/onboarding). */
function appointmentStatusBadge(appointments) {
  if (!appointments.length) {
    return { label: "No visit", pillClass: styles.pillNeutral };
  }

  const latest = appointments[0];
  const status = latest.status || "scheduled";

  if (status === "completed") {
    return { label: "Completed", pillClass: styles.pillOk };
  }
  if (status === "cancelled") {
    return { label: "Cancelled", pillClass: styles.pillWarn };
  }

  const ms = parseAppointmentMs(latest.date, latest.time);
  if (ms && ms < Date.now()) {
    return { label: "Awaiting wrap-up", pillClass: styles.pillWarn };
  }

  return { label: "Scheduled", pillClass: styles.pillNeutral };
}

/** Latest saved prescription document for this patient (appointments sorted newest first). */
function resolveIssuedPrescription(appointments) {
  const withText = appointments.filter((a) => a.prescriptionText?.trim());
  if (!withText.length) {
    return {
      prescriptionText: "",
      prescriptionSignatureURL: "",
      prescriptionType: "",
      prescriptionMedicationId: "",
      prescriptionStrengthId: "",
    };
  }

  const visit = withText[0];
  return {
    prescriptionText: visit.prescriptionText,
    prescriptionSignatureURL: visit.prescriptionSignatureURL || "",
    prescriptionType: visit.prescriptionType || "",
    prescriptionMedicationId: visit.prescriptionMedicationId || "",
    prescriptionStrengthId: visit.prescriptionStrengthId || "",
  };
}
