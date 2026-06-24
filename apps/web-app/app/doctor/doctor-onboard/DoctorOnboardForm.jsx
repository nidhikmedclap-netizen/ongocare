// app/doctor/doctor-onboard/DoctorOnboardForm.jsx
//
// Shared body of the doctor registration page. Rendered from both:
//   - /doctor/doctor-onboard               (default Ongo entry)
//   - /[organization]/doctor/doctor-onboard (per-portal entry)
//
// All brand / copy / orgSlug come in as props so the form's state, sections,
// validation, and submit pipeline stay identical across tenants — only the
// surrounding chrome changes.

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import BrandLogo from "@/components/BrandLogo";
import { DEFAULT_LOGO } from "@/lib/branding/defaults";
import { DEFAULT_ORG_SLUG } from "@/lib/orgs";
import { dashboardPathForRole, loginPathForRole } from "@/lib/urls/dashboardPaths";
import { dashboardUrl, isSplitSiteMode } from "@/lib/urls/siteOrigins";

import AvailabilitySection from "./_components/AvailabilitySection";
import BankingSection from "./_components/BankingSection";
import BioSection from "./_components/BioSection";
import CredentialsSection from "./_components/CredentialsSection";
import HeadshotSection from "./_components/HeadshotSection";
import IdentitySection from "./_components/IdentitySection";
import LicensesSection from "./_components/LicensesSection";
import SignatureSection from "./_components/SignatureSection";
import { useDoctorOnboardForm } from "./_lib/useDoctorOnboardForm";
import styles from "./doctor-onboard.module.css";

const DEFAULT_BRANDING = {
  ...DEFAULT_LOGO,
  brandHref: "/",
  signInHref: loginPathForRole("doctor", DEFAULT_ORG_SLUG),
};

const DEFAULT_COPY = {
  kicker: "Doctor registration",
  title: "Join the Ongo care network.",
  subtitle:
    "Set up your clinician profile, licensure, availability, and payout details. Patients can book you the moment you finish.",
  consent:
    "I confirm the licenses, signature, and banking details above are accurate, and I agree to Ongo's clinician terms.",
};

export default function DoctorOnboardForm({
  orgSlug = null,
  branding = null,
  copy = null,
  redirectAfterSuccess = null,
}) {
  const router = useRouter();
  const form = useDoctorOnboardForm({ orgSlug });

  const afterSignupPath =
    redirectAfterSuccess ||
    dashboardPathForRole("doctor", orgSlug || DEFAULT_ORG_SLUG);

  const b = { ...DEFAULT_BRANDING, ...(branding || {}) };
  const c = { ...DEFAULT_COPY, ...(copy || {}) };
  if (orgSlug && orgSlug !== DEFAULT_ORG_SLUG && !branding?.signInHref) {
    b.signInHref = loginPathForRole("doctor", orgSlug);
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    const ok = await form.submit({
      signatureDataUrl: form.signatureUploadDataUrl,
    });
    if (!ok) return;
    // Stay on the portal they registered under. When marketing/dashboard
    // origins differ, go straight to the dashboard host so middleware does
    // not bounce a signed-in user through the login page (pending screen).
    if (isSplitSiteMode()) {
      window.location.assign(dashboardUrl(afterSignupPath));
      return;
    }
    router.replace(afterSignupPath);
  };

  return (
    <main className={styles.page}>
      <div className={styles.hero} aria-hidden>
        <div className={styles.heroOrb} />
      </div>

      <div className={styles.shell}>
        <header className={styles.header}>
          <Link href={b.brandHref} className={styles.brand}>
            <BrandLogo
              branding={b}
              className={styles.brandLogo}
              imageClassName={styles.brandLogoImg}
              priority
            />
          </Link>
          <Link href={b.signInHref} className={styles.haveAcct}>
            Already have an account? <strong>Sign in</strong>
          </Link>
        </header>

        <div className={styles.titleBlock}>
          <span className={styles.kicker}>{c.kicker}</span>
          <h1 className={styles.title}>{c.title}</h1>
          <p className={styles.subtitle}>{c.subtitle}</p>
        </div>

        <form className={styles.card} onSubmit={onSubmit} noValidate>
          <IdentitySection
            values={form.values}
            update={form.update}
            showErrors={form.showErrors}
            fieldErrors={form.fieldErrors}
          />

          <CredentialsSection
            values={form.values}
            update={form.update}
            pwHint={form.pwHint}
            showErrors={form.showErrors}
            fieldErrors={form.fieldErrors}
          />

          <HeadshotSection
            values={form.values}
            photoFile={form.photoFile}
            photoPreviewUrl={form.photoPreviewUrl}
            fileInputRef={form.fileInputRef}
            onPickPhoto={form.onPickPhoto}
            clearPhoto={form.clearPhoto}
          />

          <BioSection
            values={form.values}
            update={form.update}
            showErrors={form.showErrors}
            fieldErrors={form.fieldErrors}
          />

          <LicensesSection
            values={form.values}
            updateLicense={form.updateLicense}
            addLicense={form.addLicense}
            removeLicense={form.removeLicense}
            showErrors={form.showErrors}
            fieldErrors={form.fieldErrors}
          />

          <AvailabilitySection
            values={form.values}
            update={form.update}
            addDayRange={form.addDayRange}
            removeDayRange={form.removeDayRange}
            updateDayRange={form.updateDayRange}
            showErrors={form.showErrors}
            fieldErrors={form.fieldErrors}
          />

          <SignatureSection
            signatureUploadDataUrl={form.signatureUploadDataUrl}
            signatureFileInputRef={form.signatureFileInputRef}
            onPickSignature={form.onPickSignature}
            clearSignatureUpload={form.clearSignatureUpload}
          />

          <BankingSection
            values={form.values}
            updateBanking={form.updateBanking}
            routingValid={form.routingValid}
            accountValid={form.accountValid}
            showErrors={form.showErrors}
            fieldErrors={form.fieldErrors}
          />

          <label className={styles.consent}>
            <input
              type="checkbox"
              checked={form.values.consent}
              onChange={(e) => form.update("consent", e.target.checked)}
            />
            <span>{c.consent}</span>
          </label>
          {form.showErrors && form.fieldErrors.consent && (
            <div className={styles.fieldError}>{form.fieldErrors.consent}</div>
          )}

          {form.error && <div className={styles.error}>{form.error}</div>}

          <button
            type="submit"
            className={styles.submit}
            disabled={form.submitting}
          >
            {form.submitting
              ? form.submitStatus || "Creating your profile…"
              : "Create my doctor account"}
          </button>
        </form>
      </div>
    </main>
  );
}
