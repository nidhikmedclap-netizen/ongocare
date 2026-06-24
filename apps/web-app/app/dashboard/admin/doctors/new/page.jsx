// app/dashboard/admin/doctors/new/page.jsx
//
// Super-admin only. Creates a fully-active doctor account for any portal
// using the same clinical form sections as self-serve doctor onboarding.
// The Admin SDK creates the Firebase Auth user server-side — the super-
// admin never leaves the admin console.

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PORTAL_SELECT_OPTIONS } from "@/lib/orgs/portalLabels";
import { DEFAULT_ORG_SLUG } from "@/lib/orgs";
import { useAuthUser } from "@/lib/auth/useAuthUser";
import { useAdminDashboardBase } from "../../useAdminApi";

import AvailabilitySection from "@/app/doctor/doctor-onboard/_components/AvailabilitySection";
import BankingSection from "@/app/doctor/doctor-onboard/_components/BankingSection";
import BioSection from "@/app/doctor/doctor-onboard/_components/BioSection";
import CredentialsSection from "@/app/doctor/doctor-onboard/_components/CredentialsSection";
import HeadshotSection from "@/app/doctor/doctor-onboard/_components/HeadshotSection";
import IdentitySection from "@/app/doctor/doctor-onboard/_components/IdentitySection";
import LicensesSection from "@/app/doctor/doctor-onboard/_components/LicensesSection";
import SignatureSection from "@/app/doctor/doctor-onboard/_components/SignatureSection";
import { toastSuccess } from "@/lib/ui/notify";
import { useDoctorOnboardForm } from "@/app/doctor/doctor-onboard/_lib/useDoctorOnboardForm";
import onboardStyles from "@/app/doctor/doctor-onboard/doctor-onboard.module.css";

import {
  submitAdminDoctorCreate,
} from "../_lib/submitAdminDoctorCreate";
import styles from "../../../patient/dashboard.module.css";
import admin from "../../admin.module.css";

const PORTAL_OPTIONS = PORTAL_SELECT_OPTIONS;

export default function AdminDoctorCreatePage() {
  const router = useRouter();
  const adminBase = useAdminDashboardBase();
  const { role, loading } = useAuthUser();
  const isSuper = role === "superadmin";

  const [portalSlug, setPortalSlug] = useState(DEFAULT_ORG_SLUG);
  const [initialStatus, setInitialStatus] = useState("active");

  const submitFn = useCallback(
    (args) =>
      submitAdminDoctorCreate({
        ...args,
        orgSlug: portalSlug,
        status: initialStatus,
      }),
    [portalSlug, initialStatus],
  );

  const form = useDoctorOnboardForm({ orgSlug: portalSlug, submitFn });

  useEffect(() => {
    if (loading) return;
    if (role && !isSuper) {
      router.replace(`${adminBase}/doctors`);
    }
  }, [loading, role, isSuper, router, adminBase]);

  const onSubmit = async (e) => {
    e.preventDefault();
    const ok = await form.submit({
      signatureDataUrl: form.signatureUploadDataUrl,
    });
    if (ok) {
      toastSuccess("Doctor account created");
      router.replace(`${adminBase}/doctors`);
    }
  };

  if (loading || (role && !isSuper)) {
    return <main className={styles.loading}>Loading…</main>;
  }

  return (
    <>
      <header className={styles.pageHeader}>
        <div>
          <div className={styles.kicker}>Doctors</div>
          <h1 className={styles.pageTitle}>Add doctor</h1>
          <p className={styles.pageSubtitle}>
            Create a clinician account for any portal. The doctor can sign in
            immediately with the email and password you set here.
          </p>
        </div>
        <Link href={`${adminBase}/doctors`} className={admin.btnGhost}>
          ← Back to list
        </Link>
      </header>

      <div className={admin.tableCard} style={{ padding: "24px" }}>
        <form onSubmit={onSubmit} noValidate>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
              marginBottom: 24,
            }}
          >
            <div className={admin.modalField}>
              <label className={admin.modalLabel}>Portal</label>
              <select
                className={admin.modalInput}
                value={portalSlug}
                onChange={(e) => setPortalSlug(e.target.value)}
              >
                {PORTAL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className={admin.modalField}>
              <label className={admin.modalLabel}>Initial status</label>
              <select
                className={admin.modalInput}
                value={initialStatus}
                onChange={(e) => setInitialStatus(e.target.value)}
              >
                <option value="active">Active (can log in immediately)</option>
                <option value="pending">Pending review</option>
                <option value="deactivated">Deactivated</option>
              </select>
            </div>
          </div>

          <div className={onboardStyles.card} style={{ boxShadow: "none", border: "none", padding: 0 }}>
            <IdentitySection values={form.values} update={form.update} />
            <CredentialsSection
              values={form.values}
              update={form.update}
              pwHint={form.pwHint}
            />
            <HeadshotSection
              values={form.values}
              photoFile={form.photoFile}
              photoPreviewUrl={form.photoPreviewUrl}
              fileInputRef={form.fileInputRef}
              onPickPhoto={form.onPickPhoto}
              clearPhoto={form.clearPhoto}
            />
            <BioSection values={form.values} update={form.update} />
            <LicensesSection
              values={form.values}
              updateLicense={form.updateLicense}
              addLicense={form.addLicense}
              removeLicense={form.removeLicense}
            />
            <AvailabilitySection
              values={form.values}
              update={form.update}
              addDayRange={form.addDayRange}
              removeDayRange={form.removeDayRange}
              updateDayRange={form.updateDayRange}
            />
            <SignatureSection
              signatureUploadDataUrl={form.signatureUploadDataUrl}
              signatureFileInputRef={form.signatureFileInputRef}
              onPickSignature={form.onPickSignature}
              clearSignatureUpload={form.clearSignatureUpload}
              uploadInputId="admin-doctor-signature-upload"
            />
            <BankingSection
              values={form.values}
              updateBanking={form.updateBanking}
              routingValid={form.routingValid}
              accountValid={form.accountValid}
            />

            <label className={onboardStyles.consent}>
              <input
                type="checkbox"
                checked={form.values.consent}
                onChange={(e) => form.update("consent", e.target.checked)}
              />
              <span>
                I confirm the licenses, signature, and banking details above
                are accurate on behalf of this clinician.
              </span>
            </label>

            {form.error && (
              <div className={onboardStyles.error}>{form.error}</div>
            )}

            <button
              type="submit"
              className={onboardStyles.submit}
              disabled={!form.canSubmit}
              style={{ marginTop: 16 }}
            >
              {form.submitting
                ? form.submitStatus || "Creating doctor…"
                : "Create doctor account"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
