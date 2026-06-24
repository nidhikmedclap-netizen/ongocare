// app/dashboard/admin/doctors/page.jsx
//
// Admin doctors table — list, search, filter by status, edit priority,
// approve/reject, edit profile, set visit payment.
//
// Priority column drives the public picker order: it's a 1-based rank
// (1, 2, 3…) and the patient picker shows the three LOWEST numbers, in
// that order. 1 = shown first. Priority must be a whole number of 1 or
// higher.
//
// Portal admins: priority only. Super-admin: full PATCH.
//
// All mutations call /api/admin/doctors/[uid] (PATCH) and then refetch.

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useAdminApi, useAdminDashboardBase } from "../useAdminApi";
import { useAuthUser } from "@/lib/auth/useAuthUser";
import { DEFAULT_ORG_SLUG } from "@/lib/orgs";
import {
  formatPortalList,
  portalDisplayName,
  PORTAL_SELECT_OPTIONS,
} from "@/lib/orgs/portalLabels";
import { PORTAL_FILTER_ALL } from "@/lib/admin/portals";
import styles from "../../patient/dashboard.module.css";
import admin from "../admin.module.css";
import { readApiJson } from "@/lib/api/client";
import { toastApiError, toastSuccess } from "@/lib/ui/notify";
import { throwIfApiFailed, userErrorMessage } from "@/lib/ui/userErrorMessage";
import TablePagination from "../../_components/TablePagination";
import { usePagination } from "@/lib/ui/usePagination";
import AdminDoctorEditModal from "./_components/AdminDoctorEditModal";
import AdminModalShell from "../_components/AdminModalShell";

const STATUS_FILTERS = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending review" },
  { value: "active", label: "Active" },
  { value: "rejected", label: "Rejected" },
  { value: "deactivated", label: "Deactivated" },
];

export default function AdminDoctorsPage() {
  const { role, profile } = useAuthUser();
  const { fetchAdmin, portalKey, hydrated, isFiltered, portalLabel } = useAdminApi();
  // Only super-admin can change visit payment. Other admins see the value
  // but the input is disabled (and the API rejects the field for them).
  const isSuper = role === "superadmin";
  const adminBase = useAdminDashboardBase();
  const viewerOrgSlug = isSuper
    ? isFiltered
      ? portalKey
      : null
    : profile?.orgSlug || null;
  const canEditPriority = Boolean(
    viewerOrgSlug && viewerOrgSlug !== PORTAL_FILTER_ALL,
  );

  const [doctors, setDoctors] = useState(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editing, setEditing] = useState(null);
  const [editLoadingUid, setEditLoadingUid] = useState("");
  const [rejecting, setRejecting] = useState(null);
  const [activating, setActivating] = useState(null);
  const [deactivating, setDeactivating] = useState(null);
  const [busyUid, setBusyUid] = useState("");
  const loadGeneration = useRef(0);

  const refresh = async () => {
    try {
      const res = await fetchAdmin("/api/admin/doctors");
      const data = await readApiJson(res, "load");
      throwIfApiFailed(data, "load");
      setDoctors(Array.isArray(data.doctors) ? data.doctors : []);
      setError("");
    } catch (e) {
      setError(userErrorMessage(e, "load"));
      setDoctors([]);
    }
  };

  useEffect(() => {
    if (!hydrated) return;
    const generation = ++loadGeneration.current;
    setDoctors(null);
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchAdmin("/api/admin/doctors");
        const data = await readApiJson(res, "load");
        if (cancelled || generation !== loadGeneration.current) return;
        throwIfApiFailed(data, "load");
        setDoctors(Array.isArray(data.doctors) ? data.doctors : []);
        setError("");
      } catch (e) {
        if (cancelled || generation !== loadGeneration.current) return;
        setError(userErrorMessage(e, "load"));
        setDoctors([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [portalKey, hydrated, fetchAdmin]);

  const filtered = useMemo(() => {
    if (!doctors) return [];
    const q = query.trim().toLowerCase();
    return doctors.filter((d) => {
      if (statusFilter !== "all" && d.status !== statusFilter) return false;
      if (!q) return true;
      return (
        (d.fullName || "").toLowerCase().includes(q) ||
        (d.email || "").toLowerCase().includes(q) ||
        (d.licensedStates || []).join(" ").toLowerCase().includes(q)
      );
    });
  }, [doctors, query, statusFilter]);

  const pagination = usePagination(filtered, {
    resetDeps: [query, statusFilter, portalKey],
  });

  const patchDoctor = async (uid, body) => {
    if (!uid) {
      setError("We couldn't update that doctor. Try refreshing the page.");
      return;
    }
    setBusyUid(uid);
    setError("");
    try {
      const res = await fetchAdmin(`/api/admin/doctors/${uid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await readApiJson(res, "update");
      throwIfApiFailed(data, "update");
      await refresh();
      toastSuccess("Doctor updated");
    } catch (e) {
      setError(toastApiError(e, { fallback: "update" }));
    } finally {
      setBusyUid("");
    }
  };

  const setPriority = async (uid, value) => {
    if (!canEditPriority) {
      setError("Select a portal in the sidebar before setting doctor priority.");
      return;
    }
    const n = Number(value);
    // Priority is a 1-based rank — reject 0, negatives, and decimals. The input
    // is reset to its previous value (see onBlur) so the display stays valid.
    if (!Number.isInteger(n) || n < 1) {
      setError("Priority must be a whole number of 1 or higher.");
      return;
    }
    await patchDoctor(uid, { priority: n });
  };

  const setVisitPayment = async (uid, dollars) => {
    const n = Math.round(Number(dollars) * 100);
    if (!Number.isFinite(n) || n < 0 || n > 99999999) {
      setError("Visit payment must be a valid dollar amount.");
      return;
    }
    await patchDoctor(uid, { appointmentPaymentCents: n });
  };

  const setPortals = async (uid, orgSlugs) => {
    if (!Array.isArray(orgSlugs) || orgSlugs.length === 0) {
      setError("At least one portal must be selected.");
      return;
    }
    await patchDoctor(uid, { orgSlugs });
  };

  const openEdit = async (summary) => {
    setEditLoadingUid(summary.uid);
    setError("");
    try {
      const res = await fetchAdmin(`/api/admin/doctors/${summary.uid}`);
      const data = await readApiJson(res, "load");
      throwIfApiFailed(data, "load");
      setEditing(data.doctor);
    } catch (e) {
      setError(userErrorMessage(e, "load"));
    } finally {
      setEditLoadingUid("");
    }
  };

  return (
    <>
      <header className={styles.pageHeader}>
        <div>
          <div className={styles.kicker}>Doctors</div>
          <h1 className={styles.pageTitle}>Clinician management</h1>
          <p className={styles.pageSubtitle}>
            {isSuper
              ? isFiltered
                ? `Managing doctors for ${portalLabel}. Priority applies to this portal only.`
                : "Approve applications and review registration details. Select a portal in the sidebar to set per-portal priority."
              : "View your portal's clinician roster, open full profiles, and set priority for the patient picker. Contact super-admin to approve, edit, or remove accounts."}
          </p>
        </div>
        {isSuper && (
          <Link
            href={`${adminBase}/doctors/new`}
            className={`${admin.btnGhost} ${admin.btnApprove}`}
          >
            + Add doctor
          </Link>
        )}
      </header>

      <div className={admin.tableCard}>
        <div className={admin.tableToolbar}>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, or state…"
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
            {doctors === null
              ? "Loading…"
              : `${filtered.length} of ${doctors.length}`}
          </span>
        </div>

        {isSuper && !isFiltered && (
          <div
            role="note"
            style={{
              padding: "10px 20px",
              fontSize: 13,
              color: "#92400e",
              background: "#fffbeb",
              borderBottom: "1px solid #fcd34d",
            }}
          >
            Select a portal in the sidebar to view and set doctor priority for that portal.
          </div>
        )}

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
                <th>Doctor</th>
                <th>States</th>
                <th>Status</th>
                <th>Portals</th>
                <th>
                  Priority
                  {canEditPriority ? (
                    <span className={admin.cellSub} style={{ display: "block", fontWeight: 500 }}>
                      {portalDisplayName(viewerOrgSlug)}
                    </span>
                  ) : null}
                </th>
                <th title={isSuper ? "Fixed payment per completed visit (USD)" : "Set by super-admin"}>
                  Visit payment
                </th>
                {isSuper && <th style={{ textAlign: "right" }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {pagination.paginatedItems.map((d) => (
                <tr key={`${d.uid}-${viewerOrgSlug || "all"}`}>
                  <td>
                    <div className={admin.cellMain}>
                      <div
                        className={admin.cellAvatar}
                        style={d.photoURL ? { backgroundImage: `url("${d.photoURL}")` } : undefined}
                        aria-hidden
                      >
                        {!d.photoURL && (d.firstName?.[0] || d.fullName?.[0] || "D").toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <Link
                          href={`${adminBase}/doctors/${d.uid}`}
                          className={admin.rowLink}
                        >
                          Dr. {d.fullName}
                        </Link>
                        <div className={admin.cellSub}>{d.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={admin.cellSub} style={{ whiteSpace: "normal" }}>
                      {(d.licensedStates || []).join(", ") || "—"}
                    </span>
                  </td>
                  <td>
                    <span className={`${admin.statusPill} ${statusClass(d.status)}`}>
                      {d.status}
                    </span>
                  </td>
                  <td>
                    <PortalCell
                      doctor={d}
                      isSuper={isSuper}
                      viewerOrgSlug={viewerOrgSlug}
                      busy={busyUid === d.uid}
                      onCommit={(orgSlugs) => setPortals(d.uid, orgSlugs)}
                    />
                  </td>
                  <td>
                    <DoctorPriorityInput
                      doctorUid={d.uid}
                      fullName={d.fullName}
                      priority={d.priority}
                      portalSlug={viewerOrgSlug}
                      disabled={busyUid === d.uid || !canEditPriority}
                      canEdit={canEditPriority}
                      onCommit={(value) => setPriority(d.uid, value)}
                      onInvalid={() =>
                        setError("Priority must be a whole number of 1 or higher.")
                      }
                    />
                  </td>
                  <td>
                    <VisitPaymentCell
                      doctor={d}
                      isSuper={isSuper}
                      busy={busyUid === d.uid}
                      onCommit={(dollars) => setVisitPayment(d.uid, dollars)}
                    />
                  </td>
                  {isSuper && (
                    <td style={{ textAlign: "right" }}>
                      <div className={admin.rowActions}>
                        {d.status === "pending" && (
                          <button
                            type="button"
                            className={`${admin.btnGhost} ${admin.btnApprove}`}
                            disabled={busyUid === d.uid}
                            onClick={() => patchDoctor(d.uid, { status: "active" })}
                          >
                            Approve
                          </button>
                        )}
                        {d.status === "active" && (
                          <button
                            type="button"
                            className={admin.btnGhost}
                            disabled={busyUid === d.uid}
                            onClick={() => setDeactivating(d)}
                          >
                            Deactivate
                          </button>
                        )}
                        {d.status === "pending" && (
                          <button
                            type="button"
                            className={admin.btnGhost}
                            disabled={busyUid === d.uid}
                            onClick={() => setRejecting(d)}
                          >
                            Reject
                          </button>
                        )}
                        {(d.status === "rejected" || d.status === "deactivated") && (
                          <button
                            type="button"
                            className={`${admin.btnGhost} ${admin.btnApprove}`}
                            disabled={busyUid === d.uid}
                            onClick={() => setActivating(d)}
                          >
                            Activate
                          </button>
                        )}
                        <button
                          type="button"
                          className={admin.btnGhost}
                          disabled={busyUid === d.uid || editLoadingUid === d.uid}
                          onClick={() => openEdit(d)}
                        >
                          {editLoadingUid === d.uid ? "Loading…" : "Edit"}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {filtered.length === 0 && doctors !== null && (
                <tr>
                  <td colSpan={isSuper ? 7 : 6}>
                    <div className={admin.emptyState}>
                      <div className={admin.emptyStateTitle}>
                        No doctors match your filters
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

      {isSuper && rejecting && (
        <RejectDoctorModal
          doctor={rejecting}
          onClose={() => setRejecting(null)}
          onConfirm={async (rejectionRemark) => {
            await patchDoctor(rejecting.uid, { status: "rejected", rejectionRemark });
            setRejecting(null);
          }}
        />
      )}

      {isSuper && activating && (
        <ActivateDoctorModal
          doctor={activating}
          onClose={() => setActivating(null)}
          onConfirm={async () => {
            await patchDoctor(activating.uid, { status: "active" });
            setActivating(null);
          }}
        />
      )}

      {isSuper && deactivating && (
        <DeactivateDoctorModal
          doctor={deactivating}
          onClose={() => setDeactivating(null)}
          onConfirm={async () => {
            await patchDoctor(deactivating.uid, { status: "deactivated" });
            setDeactivating(null);
          }}
        />
      )}

      {editing && (
        <AdminDoctorEditModal
          doctor={editing}
          onClose={() => setEditing(null)}
          onSaved={refresh}
        />
      )}
    </>
  );
}

/**
 * Controlled priority field — re-syncs when the selected portal or server value changes.
 */
function DoctorPriorityInput({
  doctorUid,
  fullName,
  priority,
  portalSlug,
  disabled,
  canEdit,
  onCommit,
  onInvalid,
}) {
  const formatPriority = (value) => (value >= 1 ? String(value) : "");
  const [value, setValue] = useState(() => formatPriority(priority));

  useEffect(() => {
    setValue(formatPriority(priority));
  }, [priority, portalSlug, doctorUid]);

  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[1-9][0-9]*"
      maxLength={4}
      value={value}
      placeholder="—"
      className={admin.priorityInput}
      disabled={disabled}
      title={
        canEdit && portalSlug
          ? `Priority on ${portalDisplayName(portalSlug)}`
          : "Select a portal in the sidebar to set priority"
      }
      onBeforeInput={(e) => {
        if (typeof e.data === "string" && /\D/.test(e.data)) {
          e.preventDefault();
        }
      }}
      onPaste={(e) => {
        const text = e.clipboardData.getData("text") || "";
        if (!/^\d+$/.test(text)) {
          e.preventDefault();
        }
      }}
      onChange={(e) => {
        let cleaned = e.target.value.replace(/\D/g, "").replace(/^0+/, "");
        if (cleaned.length > 4) cleaned = cleaned.slice(0, 4);
        setValue(cleaned);
      }}
      onBlur={() => {
        const raw = value.trim();
        const n = Number(raw);
        if (raw !== "" && Number.isInteger(n) && n >= 1) {
          if (n !== priority) onCommit(n);
          return;
        }
        setValue(formatPriority(priority));
        if (raw !== "") onInvalid();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
      aria-label={`Priority for Dr. ${fullName}`}
    />
  );
}

/**
 * Portal assignment cell. Super-admin gets a multi-select menu; portal admins
 * see a read-only list. Reassignment is super-admin-only (enforced in the API).
 */
function PortalCell({ doctor, isSuper, viewerOrgSlug, busy, onCommit }) {
  const [open, setOpen] = useState(false);
  const assigned =
    doctor.orgSlugs?.length > 0
      ? doctor.orgSlugs
      : [doctor.orgSlug || DEFAULT_ORG_SLUG];

  if (!isSuper) {
    const slug = viewerOrgSlug || assigned[0] || DEFAULT_ORG_SLUG;
    return (
      <span className={admin.cellSub} style={{ fontWeight: 600 }}>
        {portalDisplayName(slug)}
      </span>
    );
  }

  const displayNames = assigned.map(portalDisplayName);
  const label =
    displayNames.length <= 2
      ? displayNames.join(", ")
      : `${displayNames.length} portals`;

  const togglePortal = (slug) => {
    const set = new Set(assigned);
    if (set.has(slug)) {
      if (set.size <= 1) return;
      set.delete(slug);
    } else {
      set.add(slug);
    }
    onCommit(Array.from(set));
    setOpen(false);
  };

  return (
    <div style={{ position: "relative", minWidth: 120 }}>
      <button
        type="button"
        className={admin.filterSelect}
        disabled={busy}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`Portals for Dr. ${doctor.fullName}`}
        style={{ width: "100%", textAlign: "left", cursor: busy ? "default" : "pointer" }}
      >
        {label}
      </button>
      {open && (
        <>
          <div
            role="presentation"
            style={{ position: "fixed", inset: 0, zIndex: 20 }}
            onClick={() => setOpen(false)}
          />
          <div
            role="listbox"
            aria-label={`Portals for Dr. ${doctor.fullName}`}
            style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              left: 0,
              zIndex: 21,
              minWidth: 160,
              background: "var(--color-surface, #fff)",
              border: "1px solid var(--color-border, #e6e6e6)",
              borderRadius: 8,
              boxShadow: "0 8px 24px rgba(15, 23, 42, 0.12)",
              padding: "6px 0",
            }}
          >
            {PORTAL_SELECT_OPTIONS.map((opt) => {
              const slug = opt.value;
              const checked = assigned.includes(slug);
              return (
                <label
                  key={slug}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 12px",
                    cursor: busy ? "default" : "pointer",
                    fontSize: 13,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={busy || (checked && assigned.length <= 1)}
                    onChange={() => togglePortal(slug)}
                  />
                  {opt.label}
                </label>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Commission % cell. Two visual modes:
 *
 *   - super-admin → editable input with the same strict keystroke rules
 *     as priority (no "e", "+", "-", ".", paste guard, leading-zero strip).
 *     Range is 0–100 inclusive; commits on blur or Enter.
 *   - non-super  → static read-only "N%" or "—". Visible by design so the
 *     portal admin understands their roster economics without being able
 *     to alter them.
 *
 * The input is uncontrolled (defaultValue + onBlur commit) so React doesn't
 * re-render every keystroke — same pattern the priority cell uses, which
 * keeps focus stable during inline edits.
 */
function VisitPaymentCell({ doctor, isSuper, busy, onCommit }) {
  const currentCents =
    typeof doctor.appointmentPaymentCents === "number"
      ? doctor.appointmentPaymentCents
      : null;
  const currentDollars =
    currentCents == null ? null : (currentCents / 100).toFixed(2);

  if (!isSuper) {
    return (
      <span className={admin.cellSub} style={{ fontWeight: 600 }}>
        {currentDollars == null ? "—" : `$${currentDollars}`}
      </span>
    );
  }

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      <span className={admin.cellSub} aria-hidden>$</span>
      <input
        type="text"
        inputMode="decimal"
        defaultValue={currentDollars ?? ""}
        placeholder="—"
        className={admin.priorityInput}
        style={{ width: 72 }}
        disabled={busy}
        onBlur={(e) => {
          const raw = e.target.value.trim();
          if (raw === "") {
            e.target.value = currentDollars ?? "";
            return;
          }
          const n = Number(raw);
          if (Number.isFinite(n) && n >= 0) {
            const nextCents = Math.round(n * 100);
            if (nextCents !== currentCents) onCommit(n);
            return;
          }
          e.target.value = currentDollars ?? "";
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        aria-label={`Visit payment for Dr. ${doctor.fullName}`}
      />
    </div>
  );
}

function RejectDoctorModal({ doctor, onClose, onConfirm }) {
  const [remark, setRemark] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!remark.trim()) return;
    setSaving(true);
    await onConfirm(remark.trim());
    setSaving(false);
  };

  return (
    <AdminModalShell
      title="Reject doctor"
      subtitle={`Dr. ${doctor.fullName}`}
      onClose={onClose}
      onSubmit={submit}
      footer={
        <div className={admin.modalActions}>
          <button type="button" className={admin.btnGhost} onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            type="submit"
            className={`${admin.btnGhost} ${admin.btnDanger}`}
            disabled={saving || !remark.trim()}
          >
            {saving ? "Rejecting…" : "Reject doctor"}
          </button>
        </div>
      }
    >
      <div className={admin.modalField}>
        <label className={admin.modalLabel}>Rejection reason (required)</label>
        <textarea
          className={admin.modalInput}
          rows={4}
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          required
          maxLength={500}
        />
      </div>
    </AdminModalShell>
  );
}

function ActivateDoctorModal({ doctor, onClose, onConfirm }) {
  const [saving, setSaving] = useState(false);
  const hadRejection = doctor.status === "rejected" && doctor.rejectionRemark;

  const submit = async () => {
    setSaving(true);
    await onConfirm();
    setSaving(false);
  };

  return (
    <AdminModalShell
      title="Activate doctor"
      subtitle={`Dr. ${doctor.fullName}`}
      onClose={onClose}
      as="div"
      footer={
        <div className={admin.modalActions}>
          <button type="button" className={admin.btnGhost} onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            type="button"
            className={`${admin.btnGhost} ${admin.btnApprove}`}
            disabled={saving}
            onClick={submit}
          >
            {saving ? "Activating…" : "Activate doctor"}
          </button>
        </div>
      }
    >
      {hadRejection && (
        <div className={admin.modalAlert}>
          <strong style={{ display: "block", marginBottom: 6 }}>
            Previous rejection reason
          </strong>
          {doctor.rejectionRemark}
        </div>
      )}
    </AdminModalShell>
  );
}

function DeactivateDoctorModal({ doctor, onClose, onConfirm }) {
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    await onConfirm();
    setSaving(false);
  };

  return (
    <AdminModalShell
      title="Deactivate doctor"
      subtitle={`Dr. ${doctor.fullName}`}
      onClose={onClose}
      as="div"
      footer={
        <div className={admin.modalActions}>
          <button type="button" className={admin.btnGhost} onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            type="button"
            className={`${admin.btnGhost} ${admin.btnDanger}`}
            disabled={saving}
            onClick={submit}
          >
            {saving ? "Deactivating…" : "Deactivate doctor"}
          </button>
        </div>
      }
    >
      <p className={admin.modalNoteCard} style={{ marginTop: 0 }}>
        They will be removed from the patient doctor picker and cannot log in
        until reactivated.
      </p>
    </AdminModalShell>
  );
}

function statusClass(s) {
  switch (s) {
    case "active":
      return admin.statusActive;
    case "pending":
      return admin.statusPending;
    case "rejected":
      return admin.statusRejected;
    case "deactivated":
      return admin.statusDeactivated;
    default:
      return admin.statusDeactivated;
  }
}
