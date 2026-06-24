// app/doctor/doctor-onboard/_lib/useDoctorOnboardForm.js
//
// Single hook the doctor-onboard page consumes. Owns the entire form
// lifecycle: values, updaters, photo state, signature upload, derived
// validation, submit state, and the submit action itself.

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { passwordValidationMessage } from "@/app/weightloss-onboard/utils";
import { emptyLicense, initialFormState } from "./constants";
import {
  accountValid,
  availabilityValid,
  bankingValid,
  doctorFieldErrors,
  formIsSubmittable,
  licensesValid,
  routingValid,
} from "./validation";
import { mapSignupError, submitDoctorSignup } from "./submit";
import {
  clearFileInput,
  DOCTOR_IMAGE_FORMAT_HINT,
  isAllowedDoctorImageDataUrl,
  validateDoctorImageFile,
} from "./imageUpload";
import { toastFormInvalid, toastSuccess, toastApiError, toastError } from "@/lib/ui/notify";
import { userErrorMessage } from "@/lib/ui/userErrorMessage";

// `orgSlug` identifies the portal the doctor is registering under. The
// onboard page reads it from the `?org=<slug>` query string (set by patient
// portal pages when they deep-link to doctor signup). Defaults to null;
// the server falls back to DEFAULT_ORG_SLUG when no slug is supplied.
export function useDoctorOnboardForm({ orgSlug = null, submitFn = null } = {}) {
  const fileInputRef = useRef(null);
  const signatureFileInputRef = useRef(null);
  const [values, setValues] = useState(initialFormState);

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState("");

  const [signatureUploadDataUrl, setSignatureUploadDataUrl] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState("");
  const [error, setError] = useState("");
  const [showErrors, setShowErrors] = useState(false);

  // Revoke object URLs on unmount or when a new preview replaces the old.
  useEffect(() => {
    return () => {
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    };
  }, [photoPreviewUrl]);

  /* ── Updaters ─────────────────────────────────────────────────────── */

  const update = (field, value) =>
    setValues((p) => ({ ...p, [field]: value }));

  const syncHomeState = (licenses, currentHome) => {
    const states = Array.from(
      new Set(
        licenses.map((l) => String(l?.state || "").trim().toUpperCase()).filter(Boolean),
      ),
    );
    if (states.length === 0) return "";
    if (currentHome && states.includes(String(currentHome).toUpperCase())) {
      return String(currentHome).toUpperCase();
    }
    return states[0];
  };

  const updateLicense = (i, field, value) =>
    setValues((p) => {
      const next = [...p.licenses];
      next[i] = { ...next[i], [field]: value };
      return {
        ...p,
        licenses: next,
        homeState: syncHomeState(next, p.homeState),
      };
    });

  const addLicense = () =>
    setValues((p) => {
      const next = [...p.licenses, emptyLicense()];
      return { ...p, licenses: next, homeState: syncHomeState(next, p.homeState) };
    });

  const removeLicense = (i) =>
    setValues((p) => {
      const next =
        p.licenses.length === 1
          ? p.licenses
          : p.licenses.filter((_, idx) => idx !== i);
      return { ...p, licenses: next, homeState: syncHomeState(next, p.homeState) };
    });

  const updateDay = (key, patch) =>
    setValues((p) => ({
      ...p,
      availability: {
        ...p.availability,
        [key]: { ...p.availability[key], ...patch },
      },
    }));

  const addDayRange = (key) =>
    setValues((p) => {
      const ranges = p.availability[key]?.ranges || [];
      return {
        ...p,
        availability: {
          ...p.availability,
          [key]: { ranges: [...ranges, { start: "09:00", end: "12:00" }] },
        },
      };
    });

  const removeDayRange = (key, idx) =>
    setValues((p) => {
      const ranges = (p.availability[key]?.ranges || []).filter((_, i) => i !== idx);
      return {
        ...p,
        availability: {
          ...p.availability,
          [key]: { ranges },
        },
      };
    });

  const updateDayRange = (key, idx, field, value) =>
    setValues((p) => {
      const ranges = [...(p.availability[key]?.ranges || [])];
      ranges[idx] = { ...ranges[idx], [field]: value };
      return {
        ...p,
        availability: {
          ...p.availability,
          [key]: { ranges },
        },
      };
    });

  const updateBanking = (field, value) =>
    setValues((p) => ({ ...p, banking: { ...p.banking, [field]: value } }));

  /* ── Photo ────────────────────────────────────────────────────────── */

  const showImageUploadError = (message) => {
    setError(message);
    toastError("Invalid image format", message);
  };

  const onPickPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateDoctorImageFile(file, 6);
    if (err) {
      showImageUploadError(err);
      clearFileInput(fileInputRef);
      return;
    }
    setError("");
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    setPhotoFile(file);
    setPhotoPreviewUrl(URL.createObjectURL(file));
  };

  const clearPhoto = () => {
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    setPhotoFile(null);
    setPhotoPreviewUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /* ── Signature upload ─────────────────────────────────────────────── */

  const onPickSignature = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateDoctorImageFile(file, 2);
    if (err) {
      showImageUploadError(err);
      clearFileInput(signatureFileInputRef);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (!isAllowedDoctorImageDataUrl(result)) {
        showImageUploadError(DOCTOR_IMAGE_FORMAT_HINT);
        clearFileInput(signatureFileInputRef);
        return;
      }
      setError("");
      setSignatureUploadDataUrl(result);
    };
    reader.onerror = () => {
      showImageUploadError("Could not read that image. Try another file.");
      clearFileInput(signatureFileInputRef);
    };
    reader.readAsDataURL(file);
  };

  const clearSignatureUpload = () => {
    setSignatureUploadDataUrl("");
    if (signatureFileInputRef.current) signatureFileInputRef.current.value = "";
  };

  /* ── Derived ──────────────────────────────────────────────────────── */

  const pwHint = useMemo(
    () => passwordValidationMessage(values.password),
    [values.password],
  );

  const flags = useMemo(
    () => ({
      licensesValid: licensesValid(values.licenses),
      availabilityValid: availabilityValid(values.availability),
      routingValid: routingValid(values.banking.routingNumber),
      accountValid: accountValid(values.banking.accountNumber),
      bankingValid: bankingValid(values.banking),
    }),
    [values.licenses, values.availability, values.banking],
  );

  const fieldErrors = useMemo(
    () => doctorFieldErrors(values),
    [values],
  );

  const canSubmit = !submitting && formIsSubmittable(values);

  /* ── Submit ───────────────────────────────────────────────────────── */

  const submit = async ({ signatureDataUrl }) => {
    setShowErrors(true);
    if (!formIsSubmittable(values)) {
      toastFormInvalid();
      return false;
    }
    setError("");
    setSubmitting(true);
    try {
      if (submitFn) {
        await submitFn({
          form: values,
          photoFile,
          signatureDataUrl,
          orgSlug,
          onStatus: setSubmitStatus,
        });
      } else {
        await submitDoctorSignup({
          form: values,
          photoFile,
          signatureDataUrl,
          orgSlug,
          onStatus: setSubmitStatus,
        });
      }
      if (!submitFn) {
        toastSuccess("Registration submitted", "We'll review your application shortly.");
      }
      return true;
    } catch (err) {
      const message = userErrorMessage(mapSignupError(err), "generic");
      setError(message);
      toastApiError(message);
      const code = err?.code || "";
      if (code === "auth/weak-password" || code === "auth/email-already-in-use") {
        setShowErrors(true);
      }
      setSubmitting(false);
      setSubmitStatus("");
      return false;
    }
  };

  return {
    values,
    update,
    updateLicense,
    addLicense,
    removeLicense,
    updateDay,
    addDayRange,
    removeDayRange,
    updateDayRange,
    updateBanking,
    photoFile,
    photoPreviewUrl,
    fileInputRef,
    onPickPhoto,
    clearPhoto,
    signatureUploadDataUrl,
    signatureFileInputRef,
    onPickSignature,
    clearSignatureUpload,
    pwHint,
    ...flags,
    submitting,
    submitStatus,
    error,
    showErrors,
    fieldErrors,
    canSubmit,
    submit,
  };
}
