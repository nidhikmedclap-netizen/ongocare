// components/doctor/PrescriptionPanel.jsx
//
// Prescription builder — used on patient detail (always visible) and inside
// appointment rows (optional via checkbox).

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  PRESCRIPTION_TYPES,
  defaultSelectionForType,
  getMedicationsByType,
  getStrengthOptions,
  inferPrescriptionType,
  normalizeMedicationId,
  normalizeStrengthId,
} from "@/lib/prescriptions/catalog";
import { buildPrescriptionText } from "@/lib/prescriptions/format";
import { resolveDoctorSignatureUrl } from "@/lib/doctor/signatureUrl";
import { auth } from "@/lib/firebase/auth";
import PrescriptionDocument from "@/components/prescriptions/PrescriptionDocument";
import { printTextDocument } from "@/lib/print/printTextDocument";
import { downloadTextDocumentPdf } from "@/lib/print/downloadTextDocumentPdf";
import styles from "@/app/dashboard/patient/dashboard.module.css";
import local from "./prescription.module.css";

export default function PrescriptionPanel({
  patient,
  doctorProfile,
  bmi,
  variant = "card",
  /** "builder" — appointments (edit + save). "record" — patient detail (issued text only). */
  mode = "builder",
  optional = false,
  enabled = true,
  onEnabledChange,
  initialPrescriptionType,
  initialMedicationId,
  initialStrengthId,
  onSelectionChange,
  readOnly = false,
  savedPrescriptionText = "",
  savedSignatureUrl = "",
  loading = false,
  loadError = "",
}) {
  const isRecord = mode === "record";
  const defaultInjection = defaultSelectionForType("injection");
  const normalizedInitialMed = normalizeMedicationId(initialMedicationId);
  const normalizedInitialStrength = normalizeStrengthId(
    normalizedInitialMed,
    initialStrengthId,
  );

  const [prescriptionType, setPrescriptionType] = useState(
    inferPrescriptionType({
      prescriptionType: initialPrescriptionType,
      medicationId: normalizedInitialMed,
    }),
  );
  const [medicationId, setMedicationId] = useState(
    normalizedInitialMed || defaultInjection.medicationId,
  );
  const [strengthId, setStrengthId] = useState(
    normalizedInitialStrength || defaultInjection.strengthId,
  );
  const [copied, setCopied] = useState(false);
  const onSelectionChangeRef = useRef(onSelectionChange);
  onSelectionChangeRef.current = onSelectionChange;

  useEffect(() => {
    const med = normalizeMedicationId(initialMedicationId);
    const type = inferPrescriptionType({
      prescriptionType: initialPrescriptionType,
      medicationId: med,
    });
    const strength = normalizeStrengthId(med, initialStrengthId);
    setPrescriptionType(type);
    setMedicationId(med || defaultSelectionForType(type).medicationId);
    setStrengthId(strength || getStrengthOptions(med || "")[0]?.id || "");
  }, [
    initialPrescriptionType,
    initialMedicationId,
    initialStrengthId,
  ]);

  const medicationOptions = useMemo(
    () => getMedicationsByType(prescriptionType),
    [prescriptionType],
  );

  const strengthOptions = useMemo(
    () => getStrengthOptions(medicationId),
    [medicationId],
  );

  const prescriptionText = useMemo(() => {
    if (!patient) return "";
    return buildPrescriptionText({
      patient,
      medicationId,
      strengthId,
      prescriptionType,
      doctorProfile,
      bmi,
    });
  }, [patient, medicationId, strengthId, prescriptionType, doctorProfile, bmi]);

  const displayText = isRecord
    ? savedPrescriptionText
    : readOnly && savedPrescriptionText.trim()
      ? savedPrescriptionText
      : prescriptionText;

  const liveSignatureUrl = resolveDoctorSignatureUrl(doctorProfile);
  const displaySignatureUrl =
    readOnly || isRecord ? savedSignatureUrl : liveSignatureUrl;

  useEffect(() => {
    onSelectionChangeRef.current?.({
      prescriptionType,
      medicationId,
      strengthId,
      prescriptionText,
    });
  }, [prescriptionType, medicationId, strengthId, prescriptionText]);

  const onTypeChange = (nextType) => {
    const next = defaultSelectionForType(nextType);
    setPrescriptionType(nextType);
    setMedicationId(next.medicationId);
    setStrengthId(next.strengthId);
  };

  const onMedicationChange = (nextId) => {
    const options = getStrengthOptions(nextId);
    setMedicationId(nextId);
    setStrengthId(options[0]?.id || "");
  };

  const onCopy = async () => {
    if (!displayText.trim()) return;
    try {
      await navigator.clipboard.writeText(displayText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const onPrint = async () => {
    if (!displayText.trim()) return;
    const authToken = await auth.currentUser?.getIdToken();
    await printTextDocument(displayText, {
      title: "Prescription",
      signatureUrl: displaySignatureUrl,
      authToken,
    });
  };

  const onDownloadPdf = async () => {
    if (!displayText.trim()) return;
    const authToken = await auth.currentUser?.getIdToken();
    await downloadTextDocumentPdf(displayText, {
      title: "Prescription",
      filename: "prescription.pdf",
      signatureUrl: displaySignatureUrl,
      authToken,
    });
  };

  const showBuilder = !optional || enabled;
  const wrapClass = variant === "inline" ? local.inlineWrap : local.cardWrap;

  const builderBody = (
    <>
      {loading && (
        <p className={local.loading}>Loading patient details for prescription…</p>
      )}
      {!loading && loadError && (
        <p className={local.error}>{loadError}</p>
      )}
      {!loading && !loadError && patient && showBuilder && (
        <>
          {!readOnly && !isRecord && (
            <>
              <div className={local.typePicker} role="tablist" aria-label="Prescription type">
                {PRESCRIPTION_TYPES.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    role="tab"
                    aria-selected={prescriptionType === type.id}
                    className={`${local.typeOption} ${
                      prescriptionType === type.id ? local.typeOptionActive : ""
                    }`}
                    onClick={() => onTypeChange(type.id)}
                  >
                    {type.label}
                  </button>
                ))}
              </div>

              <div className={local.form}>
                <label className={local.field}>
                  <span className={local.label}>Rx (medication)</span>
                  <select
                    className={local.input}
                    value={medicationId}
                    onChange={(e) => onMedicationChange(e.target.value)}
                  >
                    {medicationOptions.map((med) => (
                      <option key={med.id} value={med.id}>
                        {med.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={local.field}>
                  <span className={local.label}>Strength</span>
                  <select
                    className={local.input}
                    value={strengthId}
                    onChange={(e) => setStrengthId(e.target.value)}
                    disabled={strengthOptions.length === 0}
                  >
                    {strengthOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </>
          )}

          <div className={local.previewWrap}>
            <div className={local.previewHeader}>
              <span className={local.previewTitle}>
                {readOnly || isRecord ? "Prescription record" : "Prescription preview"}
              </span>
              {displayText.trim() && (
                <div className={local.actions}>
                  <button type="button" className={local.btnGhost} onClick={onCopy}>
                    {copied ? "Copied" : "Copy"}
                  </button>
                  <button type="button" className={local.btnGhost} onClick={onDownloadPdf}>
                    Download PDF
                  </button>
                  <button type="button" className={local.btnPrimary} onClick={onPrint}>
                    Print
                  </button>
                </div>
              )}
            </div>
            {displayText.trim() ? (
              <div className={local.previewDoc} aria-live="polite">
                <PrescriptionDocument
                  text={displayText}
                  signatureUrl={displaySignatureUrl}
                  compact
                />
              </div>
            ) : (
              <p className={local.emptyPreview}>
                {isRecord
                  ? "No prescription on file yet. Issue one when you complete a visit from Appointments."
                  : "No prescription on file for the completed visit."}
              </p>
            )}
          </div>
        </>
      )}
    </>
  );

  if (variant === "card") {
    return (
      <section className={styles.card}>
        <div className={styles.cardEyebrow}>Treatment</div>
        <h2 className={styles.cardTitle}>
          {readOnly || isRecord ? "Prescription" : "Issue prescription"}
        </h2>
        {isRecord ? (
          <p className={local.hint}>
            {displayText.trim()
              ? "Issued at a visit. Copy or print the saved record below."
              : "Prescriptions are created from Appointments when you complete a visit."}
          </p>
        ) : (
          <p className={local.hint}>
            {readOnly
              ? "Issued at a completed visit. You can copy or print the record; medication selections cannot be changed."
              : "Choose injection or tablet, then select medication and strength. Patient details, BMI indication, and your credentials are filled in automatically."}
          </p>
        )}
        {optional && (
          <ToggleRow
            enabled={enabled}
            onEnabledChange={onEnabledChange}
            readOnly={readOnly}
          />
        )}
        {builderBody}
      </section>
    );
  }

  return (
    <div className={wrapClass}>
      {optional && (
        <ToggleRow
          enabled={enabled}
          onEnabledChange={onEnabledChange}
          readOnly={readOnly}
        />
      )}
      {builderBody}
    </div>
  );
}

function ToggleRow({ enabled, onEnabledChange, readOnly }) {
  return (
    <label className={local.toggleRow}>
      <input
        type="checkbox"
        checked={enabled}
        onChange={(e) => onEnabledChange?.(e.target.checked)}
        disabled={readOnly}
      />
      <span className={local.toggleText}>
        <span className={local.toggleLabel}>Issue prescription for this visit</span>
        <span className={local.toggleHint}>
          Optional — leave unchecked if you need to cancel, reschedule, or review
          the patient again before prescribing.
        </span>
      </span>
    </label>
  );
}
