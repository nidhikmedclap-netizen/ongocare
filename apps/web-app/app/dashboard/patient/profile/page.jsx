// app/dashboard/patient/profile/page.jsx
//
// "My details" — view-only profile snapshot. Edit-from-dashboard is
// intentionally deferred; for now we surface every personal field captured
// during onboarding so the patient can verify what their care team sees.

"use client";

import Link from "next/link";
import { useAuthUser } from "@/lib/auth/useAuthUser";
import { formatPhoneDisplay } from "@/lib/phone/usPhone";
import { formatPatientDob } from "@/lib/prescriptions/format";
import { needsOnboardingResume } from "@/lib/billing/patientPayment";
import { onboardingResumePathFromProfile } from "@/lib/onboarding/resumePath";
import styles from "../dashboard.module.css";

export default function PatientProfile() {
  const { profile, user } = useAuthUser();
  const onb = profile?.onboarding || {};
  const showResumeOnboarding = needsOnboardingResume(profile);
  const resumeHref = onboardingResumePathFromProfile(profile);

  return (
    <>
      <header className={styles.pageHeader}>
        <div>
          <div className={styles.kicker}>Patient · My details</div>
          <h1 className={styles.pageTitle}>My details</h1>
          <p className={styles.pageSubtitle}>
            The personal information your care team uses to support you.
          </p>
        </div>
      </header>

      <div className={styles.stack}>
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Personal</h2>
          </div>
          <InfoRow label="First name" value={profile?.firstName} />
          <InfoRow label="Last name" value={profile?.lastName} />
          <InfoRow
            label="Date of birth"
            value={profile?.dob ? formatPatientDob(profile.dob) : null}
          />
          <InfoRow label="Sex at birth" value={onb.sexAtBirth} />
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Contact</h2>
          </div>
          <InfoRow label="Email" value={profile?.email || user?.email} />
          <InfoRow
            label="Phone"
            value={profile?.phone ? formatPhoneDisplay(profile.phone) : null}
          />
          <InfoRow label="Address" value={onb.address} />
          <InfoRow label="ZIP code" value={onb.zip} />
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Ethnicity</h2>
          </div>
          <TagsRow values={onb.s19} emptyText="Not specified" />
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Consents</h2>
          </div>
          <InfoRow
            label="HIPAA authorization"
            value={profile?.consentHIPAA ? "Agreed" : "Not yet"}
          />
          <InfoRow
            label="Telehealth & terms"
            value={profile?.consentTelehealth ? "Agreed" : "Not yet"}
          />
        </section>

        <div style={{ fontSize: 13, color: "var(--color-text-muted)", fontStyle: "italic" }}>
          {showResumeOnboarding ? (
            <>
              Need to update something?{" "}
              <Link
                href={resumeHref}
                style={{
                  color: "var(--color-primary-dark)",
                  textDecoration: "underline",
                }}
              >
                Open onboarding
              </Link>{" "}
              to make changes — in-dashboard editing is coming soon.
            </>
          ) : (
            <>In-dashboard editing is coming soon. Contact your care team if you need to update your details.</>
          )}
        </div>
      </div>
    </>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      <span className={styles.rowValue}>{value || "—"}</span>
    </div>
  );
}

function TagsRow({ values, emptyText }) {
  if (!Array.isArray(values) || values.length === 0) {
    return (
      <div style={{ color: "var(--color-text-muted)", fontSize: 14 }}>
        {emptyText}
      </div>
    );
  }
  return (
    <div className={styles.tagList}>
      {values.map((v) => (
        <span key={v} className={styles.tag}>
          {v}
        </span>
      ))}
    </div>
  );
}
