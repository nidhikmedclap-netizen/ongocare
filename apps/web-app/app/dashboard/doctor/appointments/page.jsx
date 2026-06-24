// app/dashboard/doctor/appointments/page.jsx
//
// Doctor's Appointments view. Filter tabs (Upcoming / Past / All) over a
// list of every appointment, plus an inline panel for editing notes and
// flipping status to completed / cancelled. Optimistic updates on PATCH.

"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuthUser } from "@/lib/auth/useAuthUser";
import { auth } from "@/lib/firebase/auth";
import PrescriptionPanel from "@/components/doctor/PrescriptionPanel";
import { computeBmiFromOnboarding } from "@/lib/prescriptions/bmi";
import {
  defaultSelectionForType,
  getStrengthOptions,
  inferPrescriptionType,
  normalizeMedicationId,
  normalizeStrengthId,
} from "@/lib/prescriptions/catalog";
import { buildPrescriptionText } from "@/lib/prescriptions/format";
import { resolveDoctorSignatureUrl } from "@/lib/doctor/signatureUrl";
import { toastApiError, toastSuccess } from "@/lib/ui/notify";
import { throwIfApiFailed, userErrorMessage } from "@/lib/ui/userErrorMessage";
import styles from "../../patient/dashboard.module.css";
import local from "./appointments.module.css";
import TablePagination from "../../_components/TablePagination";
import { usePagination } from "@/lib/ui/usePagination";
import {
  appointmentInstantMs,
  formatDoctorAppointmentWhen,
} from "@/lib/time/timezone";
import {
  CONSULTATION_TYPES,
  normalizeConsultationType,
} from "@/lib/appointments/consultationTypes";
import { sortAppointmentsAsc } from "@/lib/appointments/sort";

export default function DoctorAppointmentsPage() {
  const { user, profile } = useAuthUser();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("upcoming");
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const idToken = await auth.currentUser?.getIdToken();
        const res = await fetch("/api/doctor/appointments", {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        const data = await res.json();
        if (cancelled) return;
        throwIfApiFailed(data, "load");
        setRows(data.appointments || []);
      } catch (e) {
        if (!cancelled) setError(userErrorMessage(e, "load"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const nowMs = Date.now();
  const filtered = useMemo(() => {
    const list = rows.filter((a) => {
      const ms = appointmentInstantMs(a.date, a.time, a.doctorTimezone);
      if (filter === "upcoming") {
        return a.status === "scheduled" && ms && ms >= nowMs;
      }
      if (filter === "past") {
        return (
          a.status === "completed" ||
          a.status === "cancelled" ||
          (ms && ms < nowMs)
        );
      }
      return true;
    });
    if (filter === "upcoming") return sortAppointmentsAsc(list);
    return list;
  }, [rows, filter, nowMs]);

  const pagination = usePagination(filtered, { resetDeps: [filter] });

  const counts = useMemo(() => {
    let upcoming = 0;
    let past = 0;
    for (const a of rows) {
      const ms = appointmentInstantMs(a.date, a.time, a.doctorTimezone);
      if (a.status === "scheduled" && ms && ms >= nowMs) upcoming++;
      else if (
        a.status === "completed" ||
        a.status === "cancelled" ||
        (ms && ms < nowMs)
      ) {
        past++;
      }
    }
    return { upcoming, past, all: rows.length };
  }, [rows, nowMs]);

  const onPatch = async (id, updates) => {
    const prev = rows;
    setRows((r) => r.map((a) => (a.id === id ? { ...a, ...updates } : a)));
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/doctor/appointments/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      throwIfApiFailed(data, "save");
      setRows((r) => r.map((a) => (a.id === id ? data.appointment : a)));
      toastSuccess("Appointment saved");
    } catch (e) {
      setRows(prev);
      toastApiError(e, { title: "Couldn't save changes", fallback: "save" });
    }
  };

  return (
    <>
      <header className={styles.pageHeader}>
        <div>
          <div className={styles.kicker}>Doctor · Appointments</div>
          <h1 className={styles.pageTitle}>Appointments</h1>
          <p className={styles.pageSubtitle}>
            Your scheduled consultations, with inline notes and status updates.
          </p>
        </div>
      </header>

      {/* Filter tabs */}
      <div className={local.tabs} role="tablist">
        <FilterTab label="Upcoming" count={counts.upcoming} active={filter === "upcoming"} onClick={() => setFilter("upcoming")} />
        <FilterTab label="Past" count={counts.past} active={filter === "past"} onClick={() => setFilter("past")} />
        <FilterTab label="All" count={counts.all} active={filter === "all"} onClick={() => setFilter("all")} />
      </div>

      {loading ? (
        <section className={styles.card}>
          <p style={{ color: "var(--color-text-muted)", margin: 0 }}>Loading appointments…</p>
        </section>
      ) : error ? (
        <section className={styles.card}>
          <p style={{ color: "#b45309", margin: 0 }}>Couldn&apos;t load: {error}</p>
        </section>
      ) : filtered.length === 0 ? (
        <section className={styles.card}>
          <div className={styles.empty}>
            <div className={styles.emptyIllus}><CalendarIcon /></div>
            <div className={styles.emptyTitle}>
              {filter === "upcoming"
                ? "No upcoming appointments"
                : filter === "past"
                  ? "No past appointments"
                  : "No appointments yet"}
            </div>
            <div className={styles.emptyBody}>
              {filter === "upcoming"
                ? "Make sure your availability is set up so patients can book."
                : "Once a consultation wraps up, it'll show here."}
            </div>
          </div>
        </section>
      ) : (
        <section className={styles.card} style={{ padding: 0, overflow: "hidden" }}>
        <div className={local.list}>
          {pagination.paginatedItems.map((a) => (
            <AppointmentRow
              key={a.id}
              appt={a}
              open={openId === a.id}
              onToggle={() => setOpenId(openId === a.id ? null : a.id)}
              onPatch={(updates) => onPatch(a.id, updates)}
              doctorProfile={profile}
            />
          ))}
        </div>
        <TablePagination {...pagination} />
        </section>
      )}
    </>
  );
}

function FilterTab({ label, count, active, onClick }) {
  return (
    <button
      type="button"
      className={`${local.tab} ${active ? local.tabActive : ""}`}
      onClick={onClick}
      role="tab"
      aria-selected={active}
    >
      <span>{label}</span>
      <span className={local.tabCount}>{count}</span>
    </button>
  );
}

function AppointmentRow({ appt, open, onToggle, onPatch, doctorProfile }) {
  const [notes, setNotes] = useState(appt.notes || "");
  const [type, setType] = useState(() => normalizeConsultationType(appt.type));
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelRemark, setCancelRemark] = useState("");
  const [issuePrescription, setIssuePrescription] = useState(!!appt.prescriptionIssued);
  const [prescriptionDraft, setPrescriptionDraft] = useState(null);
  const [patient, setPatient] = useState(null);
  const [patientLoading, setPatientLoading] = useState(false);
  const [patientError, setPatientError] = useState("");

  useEffect(() => {
    setNotes(appt.notes || "");
    setType(normalizeConsultationType(appt.type));
    setShowCancelForm(false);
    setCancelRemark("");
    setIssuePrescription(!!appt.prescriptionIssued);
  }, [appt.id, appt.notes, appt.type, appt.status, appt.prescriptionIssued]);

  useEffect(() => {
    if (!open || !appt.patientUid) {
      setPatient(null);
      setPatientError("");
      return;
    }
    let cancelled = false;
    (async () => {
      setPatientLoading(true);
      setPatientError("");
      try {
        const idToken = await auth.currentUser?.getIdToken();
        const res = await fetch(`/api/doctor/patients/${appt.patientUid}`, {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        const data = await res.json();
        if (cancelled) return;
        throwIfApiFailed(data, "load");
        setPatient(data.patient);
      } catch (e) {
        if (!cancelled) {
          setPatient(null);
          setPatientError(userErrorMessage(e, "load"));
        }
      } finally {
        if (!cancelled) setPatientLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, appt.patientUid]);

  const bmi = useMemo(
    () => computeBmiFromOnboarding(patient?.onboarding),
    [patient?.onboarding],
  );

  const resolvedPrescription = useMemo(() => {
    if (!issuePrescription) {
      return {
        issued: false,
        prescriptionType: "",
        medicationId: "",
        strengthId: "",
        text: "",
      };
    }
    const prescriptionType = inferPrescriptionType({
      prescriptionType:
        prescriptionDraft?.prescriptionType || appt.prescriptionType,
      medicationId: normalizeMedicationId(
        prescriptionDraft?.medicationId || appt.prescriptionMedicationId,
      ),
    });
    const defaults = defaultSelectionForType(prescriptionType);
    const medicationId =
      normalizeMedicationId(
        prescriptionDraft?.medicationId || appt.prescriptionMedicationId,
      ) || defaults.medicationId;
    const strengths = getStrengthOptions(medicationId);
    const strengthId =
      normalizeStrengthId(
        medicationId,
        prescriptionDraft?.strengthId || appt.prescriptionStrengthId,
      ) ||
      strengths[0]?.id ||
      defaults.strengthId;
    const text =
      (patient &&
        buildPrescriptionText({
          patient,
          medicationId,
          strengthId,
          prescriptionType,
          doctorProfile,
          bmi,
        })) ||
      prescriptionDraft?.prescriptionText ||
      appt.prescriptionText ||
      "";
    return {
      issued: true,
      prescriptionType,
      medicationId,
      strengthId,
      text,
    };
  }, [
    issuePrescription,
    prescriptionDraft,
    appt.prescriptionType,
    appt.prescriptionMedicationId,
    appt.prescriptionStrengthId,
    appt.prescriptionText,
    patient,
    doctorProfile,
    bmi,
  ]);

  const when = formatDoctorAppointmentWhen(appt);
  const dtMs = when?.instantMs ?? null;
  const isPast = dtMs && dtMs < Date.now();
  const statusTone =
    appt.status === "completed"
      ? local.statusDone
      : appt.status === "cancelled"
        ? local.statusCancelled
        : isPast
          ? local.statusOverdue
          : local.statusScheduled;

  const statusLabel =
    appt.status === "completed"
      ? "Completed"
      : appt.status === "cancelled"
        ? "Cancelled"
        : isPast
          ? "Awaiting wrap-up"
          : "Scheduled";

  const notesDirty = notes !== (appt.notes || "");
  const typeDirty = type !== normalizeConsultationType(appt.type);
  const prescriptionDirty =
    issuePrescription !== !!appt.prescriptionIssued ||
    (issuePrescription &&
      (resolvedPrescription.prescriptionType !== appt.prescriptionType ||
        resolvedPrescription.medicationId !== appt.prescriptionMedicationId ||
        resolvedPrescription.strengthId !== appt.prescriptionStrengthId ||
        resolvedPrescription.text !== appt.prescriptionText));
  const dirty = notesDirty || typeDirty || prescriptionDirty;
  const locked = appt.status === "completed" || appt.status === "cancelled";
  const readOnlyRx = locked || appt.status === "cancelled";
  const rxBlocked =
    issuePrescription &&
    (patientLoading || !!patientError || !resolvedPrescription.text.trim());
  const needsPrescriptionSave =
    appt.status === "completed" &&
    issuePrescription &&
    !appt.prescriptionText?.trim();

  const buildPrescriptionPayload = () => {
    if (!resolvedPrescription.issued) {
      return { issued: false };
    }
    return {
      issued: true,
      type: resolvedPrescription.prescriptionType,
      medicationId: resolvedPrescription.medicationId,
      strengthId: resolvedPrescription.strengthId,
      text: resolvedPrescription.text,
      signatureURL: resolveDoctorSignatureUrl(doctorProfile),
    };
  };

  const buildPatch = (extra = {}) => ({
    notes,
    type,
    prescription: buildPrescriptionPayload(),
    ...extra,
  });

  const confirmCancel = () => {
    const remark = cancelRemark.trim();
    if (!remark) return;
    onPatch({ status: "cancelled", cancelRemark: remark });
    setShowCancelForm(false);
    setCancelRemark("");
  };

  return (
    <article className={local.row}>
      <button type="button" className={local.rowHead} onClick={onToggle} aria-expanded={open}>
        <div className={local.rowWhen}>
          <div className={local.rowDate}>{when?.dayLabel || "—"}</div>
          <div className={local.rowTime}>
            {when ? `${when.timeLabel} ${when.abbr}`.trim() : "—"}
          </div>
        </div>
        <div className={local.rowWho}>
          <div className={local.rowPatient}>{appt.patientName || "Patient"}</div>
          <div className={local.rowMeta}>{normalizeConsultationType(appt.type)} · {appt.patientEmail || ""}</div>
          {appt.status === "cancelled" && (
            <div className={local.rowCancelRemark}>
              {appt.cancelRemark?.trim() || "No reason provided."}
            </div>
          )}
        </div>
        <div className={local.rowEnd}>
          <span className={`${local.status} ${statusTone}`}>{statusLabel}</span>
          <span className={`${local.chevron} ${open ? local.chevronOpen : ""}`}>▾</span>
        </div>
      </button>

      {open && (
        <div className={local.rowBody}>
          <div className={local.bodyGrid}>
            <label className={local.bodyField}>
              <span className={local.fieldLabel}>Consultation type</span>
              <select
                className={local.input}
                value={type}
                onChange={(e) => setType(e.target.value)}
                disabled={locked}
              >
                {CONSULTATION_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>

            <label className={local.bodyField}>
              <span className={local.fieldLabel}>Session notes</span>
              <textarea
                className={`${local.input} ${local.textarea}`}
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Brief summary, dose, follow-up plan…"
                disabled={locked}
                readOnly={locked}
              />
            </label>
          </div>

          {appt.status !== "cancelled" && (
            <PrescriptionPanel
              variant="inline"
              optional
              enabled={issuePrescription}
              onEnabledChange={setIssuePrescription}
              patient={patient}
              doctorProfile={doctorProfile}
              bmi={bmi}
              initialPrescriptionType={appt.prescriptionType}
              initialMedicationId={appt.prescriptionMedicationId}
              initialStrengthId={appt.prescriptionStrengthId}
              onSelectionChange={setPrescriptionDraft}
              readOnly={readOnlyRx || locked}
              savedPrescriptionText={appt.prescriptionText}
              savedSignatureUrl={appt.prescriptionSignatureURL}
              loading={patientLoading}
              loadError={patientError}
            />
          )}

          {needsPrescriptionSave && (
            <p className={local.rxSaveHint}>
              Prescription is not saved yet — click <strong>Save changes</strong> so
              the patient can view it.
            </p>
          )}

          {appt.status === "cancelled" && (
            <div className={local.cancelRemarkBox}>
              <div className={local.cancelRemarkLabel}>Cancellation reason</div>
              <p className={local.cancelRemarkText}>
                {appt.cancelRemark?.trim() || "No reason provided."}
              </p>
            </div>
          )}

          {showCancelForm && appt.status !== "cancelled" && (
            <div className={local.cancelForm}>
              <label className={local.bodyField}>
                <span className={local.fieldLabel}>Reason for cancellation</span>
                <textarea
                  className={`${local.input} ${local.textarea}`}
                  rows={3}
                  value={cancelRemark}
                  onChange={(e) => setCancelRemark(e.target.value)}
                  placeholder="Explain why this appointment is being cancelled — the patient will see this message."
                  maxLength={500}
                />
              </label>
              <div className={local.cancelFormActions}>
                <button
                  type="button"
                  className={local.btnDanger}
                  disabled={!cancelRemark.trim()}
                  onClick={confirmCancel}
                >
                  Confirm cancellation
                </button>
                <button
                  type="button"
                  className={local.btnGhost}
                  onClick={() => {
                    setShowCancelForm(false);
                    setCancelRemark("");
                  }}
                >
                  Keep appointment
                </button>
              </div>
            </div>
          )}

          {!locked && (
          <div className={local.actions}>
            <button
              type="button"
              className={local.btnGhost}
              disabled={
                appt.status === "cancelled" ||
                appt.status === "completed" ||
                showCancelForm
              }
              onClick={() => setShowCancelForm(true)}
            >
              Cancel appointment
            </button>
            <div className={local.actionsRight}>
              <button
                type="button"
                className={local.btnPrimary}
                disabled={(!dirty && !needsPrescriptionSave) || rxBlocked}
                onClick={() => onPatch(buildPatch())}
              >
                {needsPrescriptionSave ? "Save prescription" : "Save changes"}
              </button>
              <button
                type="button"
                className={local.btnDark}
                disabled={
                  appt.status === "completed" ||
                  appt.status === "cancelled" ||
                  rxBlocked
                }
                onClick={() => onPatch(buildPatch({ status: "completed" }))}
              >
                Mark completed
              </button>
            </div>
          </div>
          )}

          {locked && (
            <p className={local.rxSaveHint} style={{ marginTop: 12 }}>
              This appointment is {appt.status} and can no longer be edited.
            </p>
          )}
        </div>
      )}
    </article>
  );
}

function CalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}
