// app/dashboard/admin/appointments/page.jsx
//
// Admin appointments table — all appointments across the platform. Filter
// by status, search across patient / doctor names, or cancel an appointment.

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminApi, useAdminDashboardBase } from "../useAdminApi";
import { useAuthUser } from "@/lib/auth/useAuthUser";
import styles from "../../patient/dashboard.module.css";
import admin from "../admin.module.css";
import AdminModalShell from "../_components/AdminModalShell";
import TablePagination from "../../_components/TablePagination";
import { usePagination } from "@/lib/ui/usePagination";
import { formatAdminAppointmentWhen } from "@/lib/time/timezone";
import { sortAppointmentsAsc } from "@/lib/appointments/sort";
import { toastApiError, toastSuccess } from "@/lib/ui/notify";
import { throwIfApiFailed, userErrorMessage } from "@/lib/ui/userErrorMessage";

const STATUS_FILTERS = [
  { value: "all", label: "All statuses" },
  { value: "scheduled", label: "Scheduled" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function AdminAppointmentsPage() {
  const router = useRouter();
  const adminBase = useAdminDashboardBase();
  const { role } = useAuthUser();
  const isSuper = role === "superadmin";
  const { fetchAdmin, portalKey, hydrated } = useAdminApi();
  const [appointments, setAppointments] = useState(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [busyId, setBusyId] = useState("");
  const [cancelTarget, setCancelTarget] = useState(null);

  const refresh = async () => {
    try {
      const res = await fetchAdmin("/api/admin/appointments");
      const data = await res.json();
      throwIfApiFailed(data, "load");
      setAppointments(Array.isArray(data.appointments) ? data.appointments : []);
      setError("");
    } catch (e) {
      setError(userErrorMessage(e, "load"));
      setAppointments([]);
    }
  };

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchAdmin("/api/admin/appointments");
        const data = await res.json();
        if (cancelled) return;
        throwIfApiFailed(data, "load");
        setAppointments(Array.isArray(data.appointments) ? data.appointments : []);
        setError("");
      } catch (e) {
        if (!cancelled) {
          setError(userErrorMessage(e, "load"));
          setAppointments([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [portalKey, hydrated, fetchAdmin]);

  const filtered = useMemo(() => {
    if (!appointments) return [];
    const q = query.trim().toLowerCase();
    const list = appointments.filter((a) => {
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (!q) return true;
      return (
        (a.patientName || "").toLowerCase().includes(q) ||
        (a.doctorName || "").toLowerCase().includes(q) ||
        (a.type || "").toLowerCase().includes(q) ||
        (a.patientEmail || "").toLowerCase().includes(q)
      );
    });
    if (statusFilter === "scheduled") return sortAppointmentsAsc(list);
    return list;
  }, [appointments, query, statusFilter]);

  const pagination = usePagination(filtered, {
    resetDeps: [query, statusFilter],
  });

  const cancel = async (id, cancelRemark) => {
    setBusyId(id);
    setError("");
    try {
      const res = await fetchAdmin(`/api/admin/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled", cancelRemark }),
      });
      const data = await res.json();
      throwIfApiFailed(data, "update");
      setCancelTarget(null);
      await refresh();
      toastSuccess("Appointment cancelled");
    } catch (e) {
      setError(toastApiError(e, { fallback: "update" }));
    } finally {
      setBusyId("");
    }
  };

  return (
    <>
      <header className={styles.pageHeader}>
        <div>
          <div className={styles.kicker}>Appointments</div>
          <h1 className={styles.pageTitle}>All consultations</h1>
          <p className={styles.pageSubtitle}>
            {isSuper
              ? "Every appointment across the platform — cancel mistakes, clean up stale records, or just keep an eye on bookings."
              : "View appointments for your portal. Contact super-admin to cancel or remove records."}
          </p>
        </div>
      </header>

      <div className={admin.tableCard}>
        <div className={admin.tableToolbar}>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search patient, doctor, type, or email…"
            className={admin.searchInput}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={admin.filterSelect}
          >
            {STATUS_FILTERS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <span className={admin.tableMeta}>
            {appointments === null
              ? "Loading…"
              : `${filtered.length} of ${appointments.length}`}
          </span>
        </div>

        {error && (
          <div
            role="alert"
            style={{
              padding: "10px 20px",
              color: "#b3261e",
              background: "#fde7e2",
              fontSize: 13,
              borderBottom: "1px solid var(--color-border)",
            }}
          >
            {error}
          </div>
        )}

        <div className={admin.tableScroll}>
          <table className={admin.table}>
            <thead>
              <tr>
                <th>When</th>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Type</th>
                <th>Status</th>
                {isSuper && <th style={{ textAlign: "right" }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {pagination.paginatedItems.map((a) => {
                const when = formatAdminAppointmentWhen(a);
                return (
                <tr
                  key={a.id}
                  className={admin.tableRowClickable}
                  onClick={() => router.push(`${adminBase}/appointments/${a.id}`)}
                >
                  <td>
                    <div className={admin.cellName}>{when.dateLabel}</div>
                    <div className={admin.cellSub}>
                      {when.timeLabel || "—"}
                      {when.tzLabel ? ` · ${when.tzLabel}` : ""}
                    </div>
                  </td>
                  <td>
                    <div className={admin.cellName}>{a.patientName || "—"}</div>
                    <div className={admin.cellSub}>{a.patientEmail || ""}</div>
                  </td>
                  <td>
                    <span className={admin.cellName}>{a.doctorName || "—"}</span>
                  </td>
                  <td>
                    <span className={admin.cellSub}>{a.type}</span>
                  </td>
                  <td>
                    <span className={`${admin.statusPill} ${apptStatusClass(a.status)}`}>
                      {a.status}
                    </span>
                  </td>
                  {isSuper && (
                    <td style={{ textAlign: "right" }}>
                      <div className={admin.rowActions}>
                        {a.status === "scheduled" && (
                          <button
                            type="button"
                            className={admin.btnGhost}
                            disabled={busyId === a.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setError("");
                              setCancelTarget(a);
                            }}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
                );
              })}
              {filtered.length === 0 && appointments !== null && (
                <tr>
                  <td colSpan={isSuper ? 6 : 5}>
                    <div className={admin.emptyState}>
                      <div className={admin.emptyStateTitle}>
                        No appointments match your filters
                      </div>
                      Try clearing the search or status filter.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <TablePagination {...pagination} />
      </div>

      {cancelTarget && (
        <CancelAppointmentModal
          appointment={cancelTarget}
          busy={busyId === cancelTarget.id}
          onClose={() => setCancelTarget(null)}
          onConfirm={(remark) => cancel(cancelTarget.id, remark)}
        />
      )}
    </>
  );
}

function CancelAppointmentModal({ appointment, busy, onClose, onConfirm }) {
  const [remark, setRemark] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!remark.trim()) return;
    await onConfirm(remark.trim());
    setRemark("");
  };

  return (
    <AdminModalShell
      title="Cancel appointment"
      subtitle={`${formatAdminAppointmentWhen(appointment)} — ${appointment.patientName || "Patient"} with ${appointment.doctorName || "doctor"}`}
      onClose={onClose}
      onSubmit={submit}
      footer={
        <div className={admin.modalActions}>
          <button type="button" className={admin.btnGhost} onClick={onClose} disabled={busy}>
            Keep appointment
          </button>
          <button
            type="submit"
            className={`${admin.btnGhost} ${admin.btnDanger}`}
            disabled={busy || !remark.trim()}
          >
            {busy ? "Cancelling…" : "Confirm cancellation"}
          </button>
        </div>
      }
    >
      <div className={admin.modalField}>
        <label className={admin.modalLabel}>Reason for cancellation (required)</label>
        <textarea
          className={admin.modalInput}
          rows={4}
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          placeholder="Explain why this appointment is being cancelled — the patient and doctor will see this message."
          required
          maxLength={500}
          autoFocus
        />
      </div>
    </AdminModalShell>
  );
}

function apptStatusClass(s) {
  switch (s) {
    case "scheduled":
      return admin.statusScheduled;
    case "completed":
      return admin.statusCompleted;
    case "cancelled":
      return admin.statusCancelled;
    default:
      return admin.statusDeactivated;
  }
}

