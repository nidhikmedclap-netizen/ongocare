// app/dashboard/patient/appointments/page.jsx
//
// Patient's appointment list. Reads from the appointments collection via
// /api/patient/appointments. Falls back to the onboarding `slot` + `doctor`
// fields for legacy records that pre-date the collection.

"use client";

import Link from "next/link";
import { useAuthUser } from "@/lib/auth/useAuthUser";
import {
  hasPlanCheckout,
  mergePaymentIntoOnboarding,
  needsOnboardingResume,
} from "@/lib/billing/patientPayment";
import { formatUsDate, formatUsTime } from "@/lib/dates/usDate";
import { onboardingResumePathFromProfile } from "@/lib/onboarding/resumePath";
import PrescriptionView from "@/components/patient/PrescriptionView";
import {
  patientAppointmentStatusDisplay,
} from "@/lib/appointments/patientAppointmentViews";
import { timezoneAbbreviation } from "@/lib/time/timezone";
import { usePatientAppointments } from "../usePatientAppointments";
import styles from "../dashboard.module.css";

const PLAN_LABELS = {
  "1m": "1-month program",
  "3m": "3-month program",
  "6m": "6-month program",
};

export default function PatientAppointments() {
  const { profile, user } = useAuthUser();
  const onb = mergePaymentIntoOnboarding(profile);
  const planLabel = onb.plan ? PLAN_LABELS[onb.plan] || onb.plan : null;
  const programActive = hasPlanCheckout(onb);
  const showResumeOnboarding = needsOnboardingResume(profile);
  const resumeHref = onboardingResumePathFromProfile(profile);
  const { loading, error, patientTz, upcoming, past } = usePatientAppointments({
    user,
    profile,
    onb,
  });

  const patientAbbr = timezoneAbbreviation(Date.now(), patientTz);

  return (
    <>
      <header className={styles.pageHeader}>
        <div>
          <div className={styles.kicker}>Patient · Appointments</div>
          <h1 className={styles.pageTitle}>Appointments</h1>
          <p className={styles.pageSubtitle}>
            Your scheduled and past consultations with our care team.
            {programActive && planLabel
              ? ` Visits are included in your ${planLabel.toLowerCase()} — no charge per appointment.`
              : ""}
          </p>
        </div>
      </header>

      <section className={styles.card}>
        <div className={styles.cardEyebrow}>Upcoming</div>

        {loading ? (
          <p style={{ color: "var(--color-text-muted)", margin: 0 }}>
            Loading…
          </p>
        ) : upcoming.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>📅</div>
            <div className={styles.emptyTitle}>No appointment scheduled</div>
            <div className={styles.emptyBody}>
              {error
                ? "We couldn't load your appointments — try again in a moment."
                : showResumeOnboarding
                  ? "Finish onboarding to pick a time with one of our doctors."
                  : "No upcoming appointments are scheduled right now."}
            </div>
            {showResumeOnboarding && (
              <Link
                href={resumeHref}
                className={styles.ctaPrimary}
                style={{ marginTop: 16 }}
              >
                Continue onboarding →
              </Link>
            )}
          </div>
        ) : (
          upcoming.map((a, i) => (
            <UpcomingCard
              key={a.id || i}
              appt={a}
              first={i === 0}
              patientAbbr={patientAbbr}
            />
          ))
        )}
      </section>

      <section className={styles.card} style={{ marginTop: 16 }}>
        <div className={styles.cardEyebrow}>Past</div>
        {past.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyTitle}>No past appointments</div>
            <div className={styles.emptyBody}>
              Your consultation history will appear here once you&apos;ve had
              your first visit.
            </div>
          </div>
        ) : (
          past.map((a, i) => {
            const dayLabel =
              a.view?.patient?.dayLabel || formatUsDate(a.instantMs) || "—";
            const timeLabel = a.view?.patient?.timeLabel || formatUsTime(a.instantMs);
            const abbr = a.view?.patient?.abbr || patientAbbr;
            return (
              <div key={a.id || i} className={styles.pastApptBlock}>
                <div className={styles.row}>
                  <span className={styles.rowLabel}>
                    {dayLabel}
                    {timeLabel ? ` · ${timeLabel} ${abbr}` : ""}
                  </span>
                  <span className={styles.rowValue}>
                    <strong>Dr. {a.doctorName || onb.doctor || "—"}</strong>
                    <br />
                    <span style={{ color: "var(--color-text-muted)", fontSize: 13 }}>
                      {a.type || "Consultation"} ·{" "}
                      {a.status === "cancelled" ? "Cancelled" : "Completed"}
                      {programActive && planLabel ? " · Included in program" : ""}
                    </span>
                  </span>
                </div>
                {a.status === "cancelled" && (
                  <div className={styles.cancelRemarkPatient}>
                    <span className={styles.cancelRemarkPatientLabel}>
                      Why it was cancelled
                    </span>
                    <p className={styles.cancelRemarkPatientText}>
                      {a.cancelRemark?.trim() || "No reason provided."}
                    </p>
                  </div>
                )}
                {a.status === "completed" && a.notes?.trim() && (
                  <div className={styles.sessionNotesPatient}>
                    <span className={styles.sessionNotesPatientLabel}>
                      Doctor&apos;s notes
                    </span>
                    <p className={styles.sessionNotesPatientText}>{a.notes}</p>
                  </div>
                )}
                {a.status === "completed" && a.prescriptionText?.trim() && (
                  <PrescriptionView
                    text={a.prescriptionText}
                    signatureUrl={a.prescriptionSignatureURL}
                  />
                )}
              </div>
            );
          })
        )}
      </section>
    </>
  );
}

function UpcomingCard({ appt, first, patientAbbr }) {
  const ms = appt.instantMs;
  const patientDay = appt.view?.patient?.dayLabel || formatUsDate(ms);
  const patientTime = appt.view?.patient?.timeLabel || formatUsTime(ms);
  const abbr = appt.view?.patient?.abbr || patientAbbr;
  const doctorLine =
    appt.view && !appt.view.sameWallTime
      ? `${appt.view.doctor.timeLabel} ${appt.view.doctor.abbr} (doctor's local time)`
      : "";

  return (
    <div style={first ? {} : { marginTop: 18, paddingTop: 18, borderTop: "1px solid var(--color-border)" }}>
      <h2 className={styles.cardTitle} style={{ marginBottom: 10 }}>
        {patientDay || "Time TBD"}
        {patientTime ? ` · ${patientTime} ${abbr}` : ""}
      </h2>
      {doctorLine && (
        <div
          style={{
            fontSize: 13,
            color: "var(--color-text-muted)",
            marginBottom: 8,
          }}
        >
          {doctorLine}
        </div>
      )}
      <div className={styles.row}>
        <span className={styles.rowLabel}>Doctor</span>
        <span className={styles.rowValue}>
          {appt.doctorName ? `Dr. ${appt.doctorName}` : "TBD"}
        </span>
      </div>
      <div className={styles.row}>
        <span className={styles.rowLabel}>Type</span>
        <span className={styles.rowValue}>
          {appt.type || "Initial consultation"}
        </span>
      </div>
      <div className={styles.row}>
        <span className={styles.rowLabel}>Format</span>
        <span className={styles.rowValue}>Phone consultation</span>
      </div>
      <div className={styles.row}>
        <span className={styles.rowLabel}>Status</span>
        <span className={styles.rowValue}>
          {(() => {
            const { label, pillClass } = patientAppointmentStatusDisplay(appt.status);
            return (
              <span className={`${styles.pill} ${styles[pillClass]}`}>
                {label}
              </span>
            );
          })()}
        </span>
      </div>
    </div>
  );
}

