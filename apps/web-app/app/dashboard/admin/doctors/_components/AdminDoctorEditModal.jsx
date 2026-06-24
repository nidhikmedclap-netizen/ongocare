"use client";

import IdentitySection from "@/app/doctor/doctor-onboard/_components/IdentitySection";
import HeadshotSection from "@/app/doctor/doctor-onboard/_components/HeadshotSection";
import BioSection from "@/app/doctor/doctor-onboard/_components/BioSection";
import LicensesSection from "@/app/doctor/doctor-onboard/_components/LicensesSection";
import AvailabilitySection from "@/app/doctor/doctor-onboard/_components/AvailabilitySection";
import SignatureSection from "@/app/doctor/doctor-onboard/_components/SignatureSection";
import BankingSection from "@/app/doctor/doctor-onboard/_components/BankingSection";
import { adminDoctorFormIsValid } from "../_lib/adminDoctorEditValidation";
import { useAdminDoctorEditForm } from "../_lib/useAdminDoctorEditForm";
import { submitAdminDoctorUpdate } from "../_lib/submitAdminDoctorUpdate";
import { toastApiError, toastFormInvalid, toastSuccess } from "@/lib/ui/notify";
import { userErrorMessage } from "@/lib/ui/userErrorMessage";
import { PORTAL_SELECT_OPTIONS } from "@/lib/orgs/portalLabels";
import AdminModalShell from "../../_components/AdminModalShell";
import onboardStyles from "@/app/doctor/doctor-onboard/doctor-onboard.module.css";
import admin from "../../admin.module.css";

export default function AdminDoctorEditModal({ doctor, onClose, onSaved }) {
  const form = useAdminDoctorEditForm(doctor);
  const existingSignatureUrl = form.signatureUploadDataUrl
    ? ""
    : form.existingSignatureUrl;

  const submit = async (e) => {
    e.preventDefault();
    form.setShowErrors(true);
    if (!adminDoctorFormIsValid(form.values)) {
      toastFormInvalid();
      return;
    }
    form.setError("");
    form.setSubmitting(true);
    try {
      await submitAdminDoctorUpdate({
        doctor,
        values: form.values,
        orgSlugs: form.orgSlugs,
        photoFile: form.photoFile,
        signatureUploadDataUrl: form.signatureUploadDataUrl,
        onStatus: form.setSubmitStatus,
      });
      onSaved?.();
      toastSuccess("Doctor profile updated");
      onClose();
    } catch (err) {
      const message = userErrorMessage(err, "update");
      form.setError(message);
      toastApiError(err, { fallback: "update" });
      form.setSubmitting(false);
      form.setSubmitStatus("");
    }
  };

  return (
    <AdminModalShell
      title="Edit doctor profile"
      subtitle={doctor.email}
      badge={doctor.status}
      size="wide"
      onClose={onClose}
      onSubmit={submit}
      noValidate
      footer={
        <div className={admin.modalActions}>
          <button
            type="button"
            className={admin.btnGhost}
            onClick={onClose}
            disabled={form.submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`${admin.btnGhost} ${admin.btnApprove}`}
            disabled={form.submitting}
          >
            {form.submitting
              ? form.submitStatus || "Saving…"
              : "Save all changes"}
          </button>
        </div>
      }
    >
      <div className={admin.portalChecklistCard}>
        <span className={admin.modalLabel}>Portals</span>
        <div className={admin.portalChecklistGrid}>
          {PORTAL_SELECT_OPTIONS.map((opt) => (
            <label key={opt.value} className={admin.portalCheckItem}>
              <input
                type="checkbox"
                checked={form.orgSlugs.includes(opt.value)}
                disabled={
                  form.orgSlugs.includes(opt.value) && form.orgSlugs.length <= 1
                }
                onChange={() => form.togglePortal(opt.value)}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      <div className={admin.editFormSections}>
        <IdentitySection
          values={form.values}
          update={form.update}
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
          existingSignatureUrl={existingSignatureUrl}
          signatureFileInputRef={form.signatureFileInputRef}
          onPickSignature={form.onPickSignature}
          clearSignatureUpload={form.clearSignatureUpload}
          uploadInputId="admin-edit-doctor-signature-upload"
          previewAlign="bottom-right"
        />
        <BankingSection
          values={form.values}
          updateBanking={form.updateBanking}
          routingValid={form.routingValid}
          accountValid={form.accountValid}
          showErrors={form.showErrors}
          fieldErrors={form.fieldErrors}
        />
      </div>

      {form.error && (
        <div className={onboardStyles.error} style={{ marginTop: 12 }}>
          {form.error}
        </div>
      )}
    </AdminModalShell>
  );
}
