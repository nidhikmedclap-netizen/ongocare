"use client";

import Link from "next/link";
import { computeBmiFromOnboarding } from "@/lib/prescriptions/bmi";
import PrescriptionView from "@/components/patient/PrescriptionView";
import { formatMoney, formatPaidDate, PLAN_LABELS } from "@/lib/billing/money";
import { formatIsoDateUs, formatUsDate } from "@/lib/dates/usDate";
import { formatPatientDob } from "@/lib/prescriptions/format";
import {
  hasPlanCheckout,
  isPaymentAuthorized,
  isPaymentCaptured,
  paymentStatusLabel,
  paymentStatusPillTone,
} from "@/lib/billing/patientPayment";
import {
  formatPhoneDisplay,
  formatPhoneTelHref,
} from "@/lib/phone/usPhone";
import { formatGmailComposeHref } from "@/lib/email/gmailCompose";
import styles from "../../patient/dashboard.module.css";
import local from "../../doctor/patients/[uid]/detail.module.css";
import admin from "../admin.module.css";
import { portalDisplayName } from "@/lib/orgs/portalLabels";
import {
  formatOnboardingFieldLabel,
  formatOnboardingFieldValue,
  isOnboardingFieldEmpty,
} from "@/lib/onboarding/displayFields";

export default function AdminPatientDetail({
  patient,
  backHref,
  readOnly = false,
  showPortal = false,
  transactionsHref = "",
  onSyncPayment,
  syncingPayment = false,
}) {
  const onb = patient?.onboarding || {};
  const bmi = computeBmiFromOnboarding(onb);
  const age = computeAge(patient.dob || onb.dob);
  const planLabel = PLAN_LABELS[onb.plan] || onb.plan || "—";
  const payLabel = paymentStatusLabel(onb);
  const payPillTone = paymentStatusPillTone(onb);
  const payPillClass =
    payPillTone === "ok"
      ? styles.pillOk
      : payPillTone === "warn"
        ? styles.pillWarn
        : styles.pillPending;

  return (
    <>
      <Link href={backHref} className={local.backLink}>
        ← Back to patients
      </Link>

      {readOnly && (
        <div className={admin.detailBanner}>
          View only — contact super-admin to edit or remove this record.
        </div>
      )}

      <section className={local.headerCard}>
        <div className={local.headerInner}>
          <div className={local.headerAvatar}>
            {(patient.firstName?.[0] || patient.fullName?.[0] || "?").toUpperCase()}
          </div>
          <div className={local.headerInfo}>
            <h1 className={local.headerName}>
              {patient.fullName ||
                [patient.firstName, patient.lastName].filter(Boolean).join(" ") ||
                patient.email ||
                "Patient"}
            </h1>
            <div className={local.headerMeta}>
              <span>{age != null ? `${age} years old` : "Age unknown"}</span>
              {onb.sexAtBirth && <span>· {capitalize(onb.sexAtBirth)}</span>}
              {(patient.dob || onb.dob) && (
                <span>· DOB {formatPatientDob(patient.dob || onb.dob)}</span>
              )}
              {showPortal && patient.orgSlug && (
                <span>· Portal {portalDisplayName(patient.orgSlug)}</span>
              )}
            </div>
            <div className={local.contactRow}>
              {patient.email ? (
                <a
                  href={formatGmailComposeHref(patient.email)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={local.contactChip}
                >
                  ✉ {patient.email}
                </a>
              ) : null}
              {patient.phone || onb.phone ? (
                <a
                  href={formatPhoneTelHref(patient.phone || onb.phone)}
                  className={local.contactChip}
                >
                  ☎ {formatPhoneDisplay(patient.phone || onb.phone)}
                </a>
              ) : null}
              {onb.zip && (
                <span className={local.contactChip}>📍 ZIP {onb.zip}</span>
              )}
            </div>
          </div>
          <div className={local.headerStatus}>
            <span
              className={`${styles.pill} ${patient.status === "onboarded" ? styles.pillOk : styles.pillWarn}`}
            >
              {patient.status === "onboarded" ? "Onboarded" : capitalize(patient.status || "incomplete")}
            </span>
            <span className={`${styles.pill} ${payPillClass}`}>
              {payLabel}
            </span>
          </div>
        </div>
      </section>

      <div className={styles.statRow}>
        <StatTile tone="coral" label="BMI" value={bmi != null ? bmi.toFixed(1) : "—"} sub={bmi != null ? bmiCategory(bmi) : "—"} />
        <StatTile
          tone="slate"
          label="Current weight"
          value={onb.weightLbs ? `${onb.weightLbs} lbs` : onb.weightKg ? `${onb.weightKg} kg` : "—"}
          sub={onb.heightFt ? `${onb.heightFt}'${onb.heightIn || 0}"` : onb.heightCm ? `${onb.heightCm} cm` : ""}
        />
        <StatTile
          tone="green"
          label="Goal weight"
          value={onb.wtGoal ? `${onb.wtGoal} lbs` : "—"}
          sub={onb.weightLbs && onb.wtGoal ? `${Math.max(0, Number(onb.weightLbs) - Number(onb.wtGoal))} lbs to lose` : ""}
        />
        <StatTile tone="amber" label="Plan" value={planLabel} sub={payLabel} />
      </div>

      <div className={styles.colSplit}>
        <div className={styles.stack}>
          <Card eyebrow="Care team" title="Assigned clinician">
            <Row label="Doctor" value={onb.doctor || "—"} />
            <Row label="Doctor UID" value={onb.doctorUid} mono />
            <Row label="Consultation slot" value={onb.slot?.replace("|", " · ")} />
            <Row label="Onboarding step" value={patient.currentStep || "—"} />
          </Card>

          <Card eyebrow="Medications & allergies" title="Current pharmacology">
            <Row label="Current medications" value={onb.meds} multiline />
            <Row label="Allergies" value={onb.allergies} multiline />
            <Row label="Preferred pharmacy" value={onb.pharmacy} />
          </Card>

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
          <Card eyebrow="Account" title="Profile & consents">
            <Row
              label="Email"
              value={patient.email}
              href={
                patient.email ? formatGmailComposeHref(patient.email) : undefined
              }
            />
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
            <Row
              label="Phone"
              value={formatPhoneDisplay(patient.phone) || "—"}
              href={
                patient.phone ? formatPhoneTelHref(patient.phone) : undefined
              }
            />
            <Row label="DOB" value={formatPatientDob(patient.dob)} />
            <Row label="ZIP" value={onb.zip} />
            <Row label="Address" value={onb.address} multiline />
            <Row label="State" value={onb.state} />
            <Row label="Sex at birth" value={onb.sexAtBirth} />
            <Row label="HIPAA consent" value={patient.consentHIPAA ? "Signed" : "—"} />
            <Row label="Telehealth consent" value={patient.consentTelehealth ? "Signed" : "—"} />
            <Row label="Registered" value={formatUsDate(patient.createdAtMs)} />
          </Card>

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

          {hasPlanCheckout(onb) && (
            <Card eyebrow="Billing" title="Plan signup payment">
              <Row label="Plan" value={planLabel} />
              <Row label="Status" value={payLabel} />
              <Row
                label="Amount"
                value={formatMoney(onb.paymentAmount, onb.paymentCurrency || "usd")}
              />
              <Row
                label="Card"
                value={
                  onb.paymentLast4
                    ? `${capitalize(onb.paymentBrand || "Card")} •••• ${onb.paymentLast4}`
                    : "—"
                }
              />
              <Row
                label={isPaymentCaptured(onb) ? "Paid" : "Authorized"}
                value={formatPaidDate(
                  isPaymentCaptured(onb) ? onb.paidAt : onb.paymentAuthorizedAt,
                )}
              />
              <Row label="Reference" value={onb.paymentIntentId} mono />
              {isPaymentAuthorized(onb) && onSyncPayment && (
                <button
                  type="button"
                  className={styles.ctaSecondary}
                  style={{ marginTop: 12, display: "inline-flex" }}
                  disabled={syncingPayment}
                  onClick={onSyncPayment}
                >
                  {syncingPayment ? "Syncing from Stripe…" : "Refresh payment from Stripe"}
                </button>
              )}
              <p style={{ margin: "12px 0 0", fontSize: 12.5, color: "var(--color-text-muted)" }}>
                One-time program charge at signup. Visits are not billed separately.
              </p>
              {transactionsHref ? (
                <Link
                  href={transactionsHref}
                  className={styles.ctaSecondary}
                  style={{ marginTop: 12, display: "inline-flex" }}
                >
                  View all transactions →
                </Link>
              ) : null}
            </Card>
          )}
        </div>
      </div>

      <Card eyebrow="Visits" title="All appointments" style={{ marginTop: 16 }}>
        {patient.appointments?.length ? (
          <div className={local.apptList}>
            {patient.appointments.map((a) => (
              <div key={a.id} className={local.appt}>
                <div className={local.apptWhen}>
                  <div className={local.apptDate}>{formatIsoDateUs(a.date)}</div>
                  <div className={local.apptTime}>{formatIsoTime(a.time)}</div>
                </div>
                <div className={local.apptBody}>
                  <div className={local.apptType}>
                    {a.type || "Consultation"}
                    {a.doctorName ? ` · ${a.doctorName}` : ""}
                  </div>
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
                  {a.prescriptionText?.trim() && (
                    <div style={{ marginTop: 10 }}>
                      <PrescriptionView
                        text={a.prescriptionText}
                        signatureUrl={a.prescriptionSignatureURL}
                      />
                    </div>
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
            No appointments on record.
          </p>
        )}
      </Card>

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

function Card({ eyebrow, title, children, style }) {
  return (
    <section className={styles.card} style={style}>
      <div className={styles.cardEyebrow}>{eyebrow}</div>
      <h2 className={styles.cardTitle}>{title}</h2>
      <div style={{ marginTop: 6 }}>{children}</div>
    </section>
  );
}

function Row({ label, value, href, multiline, mono }) {
  const display = typeof value === "string" || typeof value === "number" ? stringifyValue(value) : "";
  if (!display && typeof value !== "object") return null;
  const content = display || value;
  const externalLink = typeof href === "string" && /^https?:/i.test(href);
  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      {href && display ? (
        <a
          href={href}
          {...(externalLink
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
          className={`${styles.rowValue} ${local.rowLink}`}
          style={{
            ...(multiline ? { whiteSpace: "pre-wrap" } : {}),
            ...(mono ? { fontFamily: "var(--font-site)", fontSize: 12 } : {}),
            textAlign: "right",
            maxWidth: "60%",
          }}
        >
          {content}
        </a>
      ) : (
        <span
          className={styles.rowValue}
          style={{
            ...(multiline ? { whiteSpace: "pre-wrap" } : {}),
            ...(mono ? { fontFamily: "var(--font-site)", fontSize: 12 } : {}),
            textAlign: "right",
            maxWidth: "60%",
          }}
        >
          {content}
        </span>
      )}
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
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

function capitalize(s) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatIsoTime(hhmm) {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h)) return hhmm;
  const d = new Date();
  d.setHours(h, m || 0, 0, 0);
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}
