"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { emptyLicense } from "@/app/doctor/doctor-onboard/_lib/constants";
import { resolveDoctorSignatureUrl } from "@/lib/doctor/signatureUrl";
import {
  resolveDoctorHeadshotPath,
  resolveDoctorSignaturePath,
} from "@/lib/storage/resolve";
import { useSignedStorageUrl } from "@/lib/storage/useSignedStorageUrl";
import { doctorDetailToFormState } from "./doctorEditForm";
import {
  accountValid,
  adminDoctorFieldErrors,
  adminDoctorFormIsValid,
  availabilityValid,
  bankingValid,
  licensesValid,
  routingValid,
} from "./adminDoctorEditValidation";

export function useAdminDoctorEditForm(doctor) {
  const fileInputRef = useRef(null);
  const signatureFileInputRef = useRef(null);

  const [values, setValues] = useState(() => doctorDetailToFormState(doctor));
  const [orgSlugs, setOrgSlugs] = useState(
    () => doctor.orgSlugs?.length > 0 ? [...doctor.orgSlugs] : [doctor.orgSlug || "ongo"],
  );

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState(doctor.photoURL || "");

  const headshotPath = resolveDoctorHeadshotPath(doctor);
  const { url: signedHeadshotUrl } = useSignedStorageUrl(
    doctor.photoURL ? "" : headshotPath,
  );

  const [signatureUploadDataUrl, setSignatureUploadDataUrl] = useState("");

  const savedSignatureUrl = resolveDoctorSignatureUrl(doctor);
  const signaturePath = resolveDoctorSignaturePath(doctor);
  const { url: signedSignatureUrl } = useSignedStorageUrl(
    savedSignatureUrl ? "" : signaturePath,
  );
  const existingSignatureUrl =
    savedSignatureUrl || signedSignatureUrl || "";

  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState("");
  const [error, setError] = useState("");
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    setValues(doctorDetailToFormState(doctor));
    setOrgSlugs(
      doctor.orgSlugs?.length > 0 ? [...doctor.orgSlugs] : [doctor.orgSlug || "ongo"],
    );
    setPhotoFile(null);
    setSignatureUploadDataUrl("");
    setShowErrors(false);
    setError("");
  }, [doctor]);

  useEffect(() => {
    if (photoFile) return;
    setPhotoPreviewUrl(doctor.photoURL || signedHeadshotUrl || "");
  }, [doctor, signedHeadshotUrl, photoFile]);

  useEffect(() => {
    return () => {
      if (photoPreviewUrl && photoPreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(photoPreviewUrl);
      }
    };
  }, [photoPreviewUrl]);

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

  const onPickPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file for the headshot.");
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      setError("Headshot must be under 6 MB.");
      return;
    }
    setError("");
    if (photoPreviewUrl.startsWith("blob:")) URL.revokeObjectURL(photoPreviewUrl);
    setPhotoFile(file);
    setPhotoPreviewUrl(URL.createObjectURL(file));
  };

  const clearPhoto = () => {
    if (photoPreviewUrl.startsWith("blob:")) URL.revokeObjectURL(photoPreviewUrl);
    setPhotoFile(null);
    setPhotoPreviewUrl(doctor.photoURL || signedHeadshotUrl || "");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onPickSignature = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file for the signature.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Signature image must be under 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (!result.startsWith("data:image/")) {
        setError("Could not read that image. Try another file.");
        return;
      }
      setError("");
      setSignatureUploadDataUrl(result);
    };
    reader.onerror = () => setError("Could not read that image. Try another file.");
    reader.readAsDataURL(file);
  };

  const clearSignatureUpload = () => {
    setSignatureUploadDataUrl("");
    if (signatureFileInputRef.current) signatureFileInputRef.current.value = "";
  };

  const togglePortal = (slug) => {
    setOrgSlugs((prev) => {
      const set = new Set(prev);
      if (set.has(slug)) {
        if (set.size <= 1) return prev;
        set.delete(slug);
      } else {
        set.add(slug);
      }
      return Array.from(set);
    });
  };

  const fieldErrors = useMemo(() => adminDoctorFieldErrors(values), [values]);

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

  return {
    values,
    orgSlugs,
    togglePortal,
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
    existingSignatureUrl,
    signatureFileInputRef,
    onPickSignature,
    clearSignatureUpload,
    ...flags,
    submitting,
    setSubmitting,
    submitStatus,
    setSubmitStatus,
    error,
    setError,
    showErrors,
    setShowErrors,
    fieldErrors,
    canSubmit: !submitting && adminDoctorFormIsValid(values),
  };
}
