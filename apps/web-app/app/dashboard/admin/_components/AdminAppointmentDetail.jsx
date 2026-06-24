"use client";

import Link from "next/link";
import PrescriptionView from "@/components/patient/PrescriptionView";
import { DEFAULT_ORG_SLUG } from "@/lib/orgs";
import { portalDisplayName } from "@/lib/orgs/portalLabels";
import { formatAdminAppointmentWhen } from "@/lib/time/timezone";
import styles from "../../patient/dashboard.module.css";
import admin from "../admin.module.css";
import local from "../../doctor/patients/[uid]/detail.module.css";

export default function AdminAppointmentDetail({
  appointment,
  backHref,
  adminBase,
  showPortal = false,
}) {
  const when = formatAdminAppointmentWhen(appointment);
  const status = appointment.status || "scheduled";

  return (
    <>
      <Link href={backHref} className={local.backLink}>
        ← Back to appointments
      </Link>

      <section className={local.headerCard}>
        <div className={local.headerInner}>
          <div className={local.headerInfo} style={{ flex: 1, minWidth: 0 }}>
            <h1 className={local.headerName}>{appointment.type || "Consultation"}</h1>
            <div className={local.headerMeta}>
              <span>{when.dateLabel}</span>
              {when.timeLabel ? (
                <>
                  {" · "}
                  {when.timeLabel}
                  {when.tzLabel ? ` ${when.tzLabel}` : ""}
                </>
              ) : null}
            </div>
            <div className={local.contactRow} style={{ marginTop: 12 }}>
              {appointment.patientUid ? (
                <Link
                  href={`${adminBase}/patients/${appointment.patientUid}`}
                  className={local.contactChip}
                  style={{ textDecoration: "none", cursor: "pointer" }}
                >
                  Patient: {appointment.patientName || "View profile"}
                </Link>
              ) : (
                <span className={local.contactChip}>
                  Patient: {appointment.patientName || "—"}
                </span>
              )}
              {appointment.doctorUid ? (
                <Link
                  href={`${adminBase}/doctors/${appointment.doctorUid}`}
                  className={local.contactChip}
                  style={{ textDecoration: "none", cursor: "pointer" }}
                >
                  Doctor: {appointment.doctorName || "View profile"}
                </Link>
              ) : (
                <span className={local.contactChip}>
                  Doctor: {appointment.doctorName || "—"}
                </span>
              )}
            </div>
            {showPortal && appointment.orgSlug ? (
              <div className={local.headerMeta} style={{ marginTop: 8 }}>
                Portal: {portalDisplayName(appointment.orgSlug || DEFAULT_ORG_SLUG)}
              </div>
            ) : null}
          </div>
          <span
            className={`${admin.statusPill} ${apptStatusClass(status)}`}
            style={{ alignSelf: "flex-start" }}
          >
            {status}
          </span>
        </div>
      </section>

      <Card eyebrow="Visit details" title={detailTitle(status)}>
        {status === "cancelled" ? (
          <>
            <div className={local.apptCancelLabel}>Cancellation reason</div>
            <div className={local.apptCancelRemark}>
              {appointment.cancelRemark?.trim() || "No reason provided."}
            </div>
          </>
        ) : status === "completed" ? (
          <>
            {appointment.notes?.trim() ? (
              <>
                <div className={local.apptCancelLabel} style={{ color: "var(--color-text-muted)" }}>
                  Doctor&apos;s notes
                </div>
                <div className={local.apptNotes}>{appointment.notes}</div>
              </>
            ) : (
              <p style={{ color: "var(--color-text-muted)", margin: 0 }}>
                No session notes were recorded for this visit.
              </p>
            )}
            {appointment.prescriptionText?.trim() ? (
              <div style={{ marginTop: 16 }}>
                <PrescriptionView
                  text={appointment.prescriptionText}
                  signatureUrl={appointment.prescriptionSignatureURL}
                />
              </div>
            ) : appointment.prescriptionIssued ? (
              <p style={{ color: "var(--color-text-muted)", margin: "12px 0 0" }}>
                Prescription was marked issued but no prescription text is on file.
              </p>
            ) : null}
          </>
        ) : (
          <p style={{ color: "var(--color-text-muted)", margin: 0 }}>
            This visit is scheduled and has not taken place yet.
          </p>
        )}
      </Card>
    </>
  );
}

function Card({ eyebrow, title, children }) {
  return (
    <section className={styles.card}>
      <div className={styles.cardEyebrow}>{eyebrow}</div>
      <h2 className={styles.cardTitle}>{title}</h2>
      <div style={{ marginTop: 6 }}>{children}</div>
    </section>
  );
}

function detailTitle(status) {
  switch (status) {
    case "cancelled":
      return "Why this visit was cancelled";
    case "completed":
      return "Visit summary";
    default:
      return "Upcoming visit";
  }
}

function apptStatusClass(s) {
  switch (s) {
    case "scheduled":
      return admin.statusScheduled;
    case "completed":
      return admin.statusCompleted;
    case "cancelled":
      return admin.statusCancelled;
    default:
      return admin.statusDeactivated;
  }
}
