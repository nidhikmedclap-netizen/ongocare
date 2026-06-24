"use client";

import { useEffect, useMemo, useState } from "react";
import AdminFormField from "../../_components/AdminFormField";
import AdminModalShell from "../../_components/AdminModalShell";
import {
  formatPhoneDisplay,
  isValidPhone,
  PHONE_DISPLAY_PLACEHOLDER,
  PHONE_INVALID_MESSAGE,
  sanitizePhoneInput,
} from "@/lib/phone/usPhone";
import {
  ADDRESS_LIMIT,
  NAME_LIMIT,
  sanitizeAddress,
  sanitizeName,
  sanitizeZip,
} from "@/app/weightloss-onboard/utils";
import { profileMaxDobDate } from "@/app/weightloss-onboard/_lib/patientProfileValidation";
import {
  adminPatientFieldErrors,
  adminPatientFormIsValid,
} from "../_lib/adminPatientEditValidation";
import { adminPatientEditInitialValues } from "../_lib/adminPatientEditForm";
import admin from "../../admin.module.css";
import { toastApiError, toastFormInvalid, toastSuccess } from "@/lib/ui/notify";
import { userErrorMessage } from "@/lib/ui/userErrorMessage";
import onboardStyles from "@/app/doctor/doctor-onboard/doctor-onboard.module.css";

export default function AdminPatientEditModal({ patient, onClose, onSave }) {
  const initial = adminPatientEditInitialValues(patient);
  const [firstName, setFirstName] = useState(initial.firstName);
  const [lastName, setLastName] = useState(initial.lastName);
  const [phone, setPhone] = useState(initial.phone);
  const [dob, setDob] = useState(initial.dob);
  const [address, setAddress] = useState(initial.address);
  const [zip, setZip] = useState(initial.zip);
  const [saving, setSaving] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const next = adminPatientEditInitialValues(patient);
    setFirstName(next.firstName);
    setLastName(next.lastName);
    setPhone(next.phone);
    setDob(next.dob);
    setAddress(next.address);
    setZip(next.zip);
    setShowErrors(false);
    setError("");
  }, [patient]);

  const values = useMemo(
    () => ({ firstName, lastName, phone, dob, address, zip }),
    [firstName, lastName, phone, dob, address, zip],
  );

  const fieldErrors = useMemo(() => adminPatientFieldErrors(values), [values]);

  const submit = async (e) => {
    e.preventDefault();
    setShowErrors(true);
    if (!adminPatientFormIsValid(values)) {
      toastFormInvalid();
      return;
    }
    setError("");
    setSaving(true);
    try {
      await onSave({
        firstName,
        lastName,
        phone: formatPhoneDisplay(phone),
        dob,
        address,
        zip,
      });
      toastSuccess("Patient profile updated");
      onClose();
    } catch (err) {
      const message = userErrorMessage(err, "update");
      setError(message);
      toastApiError(err, { fallback: "update" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminModalShell
      title="Edit patient"
      subtitle={patient.email}
      badge={patient.status}
      onClose={onClose}
      onSubmit={submit}
      noValidate
      footer={
        <div className={admin.modalActions}>
          <button
            type="button"
            className={admin.btnGhost}
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`${admin.btnGhost} ${admin.btnApprove}`}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      }
    >
      <div className={admin.modalRow2}>
        <AdminFormField
          label="First name"
          required
          hint={showErrors ? fieldErrors.firstName : undefined}
          hintTone={showErrors && fieldErrors.firstName ? "warn" : undefined}
        >
          <input
            value={firstName}
            onChange={(e) => setFirstName(sanitizeName(e.target.value))}
            className={admin.modalInput}
            autoComplete="given-name"
            maxLength={NAME_LIMIT}
          />
        </AdminFormField>
        <AdminFormField
          label="Last name"
          required
          hint={showErrors ? fieldErrors.lastName : undefined}
          hintTone={showErrors && fieldErrors.lastName ? "warn" : undefined}
        >
          <input
            value={lastName}
            onChange={(e) => setLastName(sanitizeName(e.target.value))}
            className={admin.modalInput}
            autoComplete="family-name"
            maxLength={NAME_LIMIT}
          />
        </AdminFormField>
      </div>

      <AdminFormField
        label="Phone"
        required
        hint={phoneHint(phone, showErrors, fieldErrors.phone)}
        hintTone={phoneTone(phone, showErrors, fieldErrors.phone)}
      >
        <input
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          placeholder={PHONE_DISPLAY_PLACEHOLDER}
          maxLength={17}
          value={phone}
          onChange={(e) => setPhone(sanitizePhoneInput(e.target.value))}
          className={admin.modalInput}
        />
      </AdminFormField>

      <AdminFormField
        label="Date of birth"
        required
        hint={showErrors ? fieldErrors.dob : undefined}
        hintTone={showErrors && fieldErrors.dob ? "warn" : undefined}
      >
        <input
          type="date"
          max={profileMaxDobDate()}
          value={dob}
          onChange={(e) => setDob(e.target.value)}
          className={admin.modalInput}
        />
      </AdminFormField>

      <AdminFormField
        label="Address"
        required
        hint={showErrors ? fieldErrors.address : undefined}
        hintTone={showErrors && fieldErrors.address ? "warn" : undefined}
      >
        <input
          value={address}
          onChange={(e) => setAddress(sanitizeAddress(e.target.value))}
          className={admin.modalInput}
          autoComplete="street-address"
          maxLength={ADDRESS_LIMIT}
        />
      </AdminFormField>

      <AdminFormField
        label="ZIP"
        required
        hint={showErrors ? fieldErrors.zip : undefined}
        hintTone={showErrors && fieldErrors.zip ? "warn" : undefined}
      >
        <input
          value={zip}
          onChange={(e) => setZip(sanitizeZip(e.target.value))}
          className={admin.modalInput}
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={10}
        />
      </AdminFormField>

      <div className={admin.modalNoteCard}>
        Status is read-only and updates when a doctor completes or cancels a
        visit.
      </div>

      {error && (
        <div className={onboardStyles.error} style={{ marginTop: 12 }}>
          {error}
        </div>
      )}
    </AdminModalShell>
  );
}

function phoneHint(value, showErrors, submitError) {
  if (showErrors && submitError) return submitError;
  if (value.length === 0) return undefined;
  return isValidPhone(value) ? "Looks good." : PHONE_INVALID_MESSAGE;
}

function phoneTone(value, showErrors, submitError) {
  if (showErrors && submitError) return "warn";
  if (value.length === 0 || isValidPhone(value)) return undefined;
  return "warn";
}
