"use client";

import { resolveDoctorSignatureUrl } from "@/lib/doctor/signatureUrl";
import Link from "next/link";
import {
  formatPhoneDisplay,
  formatPhoneTelHref,
} from "@/lib/phone/usPhone";
import { formatGmailComposeHref } from "@/lib/email/gmailCompose";
import { formatMoney } from "@/lib/billing/money";
import styles from "../../patient/dashboard.module.css";
import local from "../../doctor/patients/[uid]/detail.module.css";
import admin from "../admin.module.css";
import { formatPortalList } from "@/lib/orgs/portalLabels";
import { formatUsDate } from "@/lib/dates/usDate";

const DAY_LABELS = {
  sunday: "Sunday",
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
};

export default function AdminDoctorDetail({
  doctor,
  backHref,
  readOnly = false,
  showPortal = false,
  priorityPortalLabel = "",
}) {
  const schedule = doctor.availability?.weeklySchedule || {};

  return (
    <>
      <Link href={backHref} className={local.backLink}>
        ← Back to doctors
      </Link>

      {readOnly && (
        <div className={admin.detailBanner}>
          View only — you can change priority from the doctors list. Contact super-admin to approve, edit, or remove.
        </div>
      )}

      <section className={local.headerCard}>
        <div className={local.headerInner}>
          <div
            className={local.headerAvatar}
            style={
              doctor.photoURL
                ? {
                    backgroundImage: `url("${doctor.photoURL}")`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    color: "transparent",
                  }
                : undefined
            }
          >
            {!doctor.photoURL &&
              (doctor.firstName?.[0] || doctor.fullName?.[0] || "D").toUpperCase()}
          </div>
          <div className={local.headerInfo}>
            <h1 className={local.headerName}>Dr. {doctor.fullName}</h1>
            {showPortal && (doctor.orgSlugs?.length || doctor.orgSlug) && (
              <div className={local.headerMeta}>
                <span>
                  Portals{" "}
                  {formatPortalList(
                    doctor.orgSlugs?.length ? doctor.orgSlugs : [doctor.orgSlug],
                  )}
                </span>
              </div>
            )}
            <div className={local.contactRow}>
              {doctor.email ? (
                <a
                  href={formatGmailComposeHref(doctor.email)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={local.contactChip}
                >
                  ✉ {doctor.email}
                </a>
              ) : null}
              {doctor.phone ? (
                <a
                  href={formatPhoneTelHref(doctor.phone)}
                  className={local.contactChip}
                >
                  ☎ {formatPhoneDisplay(doctor.phone)}
                </a>
              ) : null}
              <span className={local.contactChip}>
                Priority
                {priorityPortalLabel ? ` (${priorityPortalLabel})` : ""}:{" "}
                {doctor.priority >= 1 ? doctor.priority : "—"}
              </span>
              <span className={local.contactChip}>
                Visit payment{" "}
                {doctor.appointmentPaymentCents != null
                  ? formatMoney(doctor.appointmentPaymentCents, "usd")
                  : "—"}
              </span>
            </div>
          </div>
          <div className={local.headerStatus}>
            <span className={`${admin.statusPill} ${statusClass(doctor.status)}`}>
              {doctor.status}
            </span>
          </div>
        </div>
      </section>

      <div className={styles.colSplit}>
        <div className={styles.stack}>
          <Card eyebrow="Profile" title="About this clinician">
            <Row
              label="Email"
              value={doctor.email}
              href={
                doctor.email ? formatGmailComposeHref(doctor.email) : undefined
              }
            />
            <Row
              label="Phone"
              value={formatPhoneDisplay(doctor.phone) || "—"}
              href={doctor.phone ? formatPhoneTelHref(doctor.phone) : undefined}
            />
            <Row label="Bio" value={doctor.bio} multiline />
            <Row label="Licensed states" value={(doctor.licensedStates || []).join(", ")} />
            <Row label="Registered" value={formatUsDate(doctor.createdAtMs)} />
          </Card>

          <Card eyebrow="Licenses" title="State licenses">
            {doctor.licenses?.length ? (
              <div className={admin.licenseTable}>
                {doctor.licenses.map((lic, i) => (
                  <div key={`${lic.state}-${i}`} className={admin.licenseRow}>
                    <strong>{lic.state || "—"}</strong>
                    <span>{lic.licenseType || "—"}</span>
                    <span className={admin.cellSub}>{lic.licenseNumber || "—"}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "var(--color-text-muted)", margin: 0 }}>No licenses on file.</p>
            )}
          </Card>

          <Card eyebrow="Banking" title="Payout details">
            {doctor.banking ? (
              <>
                <Row label="Account holder" value={doctor.banking.accountHolder} />
                <Row label="Bank" value={doctor.banking.bankName} />
                <Row label="Account type" value={doctor.banking.accountType} />
                <Row label="Routing number" value={doctor.banking.routingNumber} mono />
                <Row label="Account number" value={doctor.banking.accountNumber} mono />
              </>
            ) : (
              <p style={{ color: "var(--color-text-muted)", margin: 0 }}>No banking details on file.</p>
            )}
          </Card>
        </div>

        <div className={styles.stack}>
          <Card eyebrow="Prescription" title="Template & signature">
            <Row label="Template" value={doctor.prescriptionTemplate} multiline />
            {resolveDoctorSignatureUrl(doctor) ? (
              <div className={admin.signatureBlock}>
                <div className={admin.detailLabel}>Signature</div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resolveDoctorSignatureUrl(doctor)}
                  alt="Doctor signature"
                  className={admin.signatureImg}
                />
              </div>
            ) : (
              <Row label="Signature" value="—" />
            )}
          </Card>

          <Card eyebrow="Availability" title="Weekly schedule">
            {doctor.availability ? (
              <>
                <Row label="Timezone" value={doctor.availability.timezone} />
                <Row label="Slot length" value={`${doctor.availability.slotDurationMinutes} min`} />
                <div className={admin.availabilityGrid}>
                  {Object.entries(DAY_LABELS).map(([key, label]) => {
                    const blocks = schedule[key] || [];
                    return (
                      <div key={key} className={admin.availabilityDay}>
                        <strong>{label}</strong>
                        <span>
                          {blocks.length
                            ? blocks.map((b) => `${b.start}–${b.end}`).join(", ")
                            : "Off"}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {(doctor.availability.blockedDates || []).length > 0 && (
                  <Row
                    label="Blocked dates"
                    value={doctor.availability.blockedDates.join(", ")}
                    multiline
                  />
                )}
              </>
            ) : (
              <p style={{ color: "var(--color-text-muted)", margin: 0 }}>
                No availability schedule on file.
              </p>
            )}
          </Card>
        </div>
      </div>
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

function Row({ label, value, href, multiline, mono }) {
  const display = stringifyValue(value);
  if (!display) return null;
  const content = display;
  const externalLink = typeof href === "string" && /^https?:/i.test(href);
  return (
    <div className={`${styles.row} ${multiline ? admin.rowStacked : ""}`}>
      <span className={styles.rowLabel}>{label}</span>
      {href ? (
        <a
          href={href}
          {...(externalLink
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
          className={`${styles.rowValue} ${local.rowLink} ${multiline ? admin.rowStackedValue : ""}`}
          style={{
            ...(multiline ? { whiteSpace: "pre-wrap" } : {}),
            ...(mono ? { fontFamily: "var(--font-site)", fontSize: 12 } : {}),
            ...(!multiline ? { textAlign: "right", maxWidth: "60%" } : {}),
          }}
        >
          {content}
        </a>
      ) : (
        <span
          className={`${styles.rowValue} ${multiline ? admin.rowStackedValue : ""}`}
          style={{
            ...(multiline ? { whiteSpace: "pre-wrap" } : {}),
            ...(mono ? { fontFamily: "var(--font-site)", fontSize: 12 } : {}),
            ...(!multiline ? { textAlign: "right", maxWidth: "60%" } : {}),
          }}
        >
          {content}
        </span>
      )}
    </div>
  );
}

function stringifyValue(v) {
  if (v == null || v === "") return "";
  if (Array.isArray(v)) return v.filter(Boolean).join(", ");
  return String(v);
}

function statusClass(s) {
  switch (s) {
    case "active":
      return admin.statusActive;
    case "pending":
      return admin.statusPending;
    case "rejected":
      return admin.statusRejected;
    default:
      return admin.statusDeactivated;
  }
}
