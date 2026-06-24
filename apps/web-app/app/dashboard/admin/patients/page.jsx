// app/dashboard/admin/patients/page.jsx
//
// Admin patients table — list, search by name/email, edit basic profile
// fields, delete the user doc. Backed by /api/admin/patients[/uid].

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAdminApi, useAdminDashboardBase } from "../useAdminApi";
import { useAuthUser } from "@/lib/auth/useAuthUser";
import { formatPhoneDisplay } from "@/lib/phone/usPhone";
import { DEFAULT_ORG_SLUG } from "@/lib/orgs";
import AdminPatientEditModal from "./_components/AdminPatientEditModal";
import { portalDisplayName } from "@/lib/orgs/portalLabels";
import styles from "../../patient/dashboard.module.css";
import admin from "../admin.module.css";
import TablePagination from "../../_components/TablePagination";
import { usePagination } from "@/lib/ui/usePagination";
import { formatUsDate } from "@/lib/dates/usDate";
import { formatPatientDob } from "@/lib/prescriptions/format";
import { readApiJson } from "@/lib/api/client";
import { throwIfApiFailed, userErrorMessage } from "@/lib/ui/userErrorMessage";
import { toastApiError } from "@/lib/ui/notify";

export default function AdminPatientsPage() {
  const { role } = useAuthUser();
  const isSuper = role === "superadmin";
  const adminBase = useAdminDashboardBase();
  const { fetchAdmin, portalKey, hydrated } = useAdminApi();
  const [patients, setPatients] = useState(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null);
  const [editLoadingUid, setEditLoadingUid] = useState("");
  const [busyUid, setBusyUid] = useState("");

  const refresh = async () => {
    try {
      const res = await fetchAdmin("/api/admin/patients");
      const data = await readApiJson(res, "load");
      throwIfApiFailed(data, "load");
      setPatients(Array.isArray(data.patients) ? data.patients : []);
      setError("");
    } catch (e) {
      setError(userErrorMessage(e, "load"));
      setPatients([]);
    }
  };

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchAdmin("/api/admin/patients");
        const data = await readApiJson(res, "load");
        if (cancelled) return;
        throwIfApiFailed(data, "load");
        setPatients(Array.isArray(data.patients) ? data.patients : []);
        setError("");
      } catch (e) {
        if (!cancelled) {
          setError(userErrorMessage(e, "load"));
          setPatients([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [portalKey, hydrated, fetchAdmin]);

  const filtered = useMemo(() => {
    if (!patients) return [];
    const q = query.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter(
      (p) =>
        (p.fullName || "").toLowerCase().includes(q) ||
        (p.email || "").toLowerCase().includes(q) ||
        (p.phone || "").toLowerCase().includes(q),
    );
  }, [patients, query]);

  const pagination = usePagination(filtered, { resetDeps: [query] });

  const openEdit = async (summary) => {
    setEditLoadingUid(summary.uid);
    setError("");
    try {
      const res = await fetchAdmin(`/api/admin/patients/${summary.uid}`);
      const data = await readApiJson(res, "load");
      throwIfApiFailed(data, "load");
      setEditing(data.patient);
    } catch (e) {
      setError(userErrorMessage(e, "load"));
    } finally {
      setEditLoadingUid("");
    }
  };

  const patchPatient = async (uid, body) => {
    setBusyUid(uid);
    try {
      const res = await fetchAdmin(`/api/admin/patients/${uid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await readApiJson(res, "update");
      throwIfApiFailed(data, "update");
      await refresh();
      setEditing(null);
    } catch (e) {
      toastApiError(userErrorMessage(e, "update"));
      throw e;
    } finally {
      setBusyUid("");
    }
  };

  return (
    <>
      <header className={styles.pageHeader}>
        <div>
          <div className={styles.kicker}>Patients</div>
          <h1 className={styles.pageTitle}>Patient accounts</h1>
          <p className={styles.pageSubtitle}>
            {isSuper
              ? "Search the patient roster. Click a name to view the full intake, then edit basic fields or remove an account."
              : "View patient accounts for your portal. Click a name to see the full intake. Contact super-admin to edit or remove records."}
          </p>
        </div>
      </header>

      <div className={admin.tableCard}>
        <div className={admin.tableToolbar}>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, or phone…"
            className={admin.searchInput}
          />
          <span className={admin.tableMeta}>
            {patients === null
              ? "Loading…"
              : `${filtered.length} of ${patients.length}`}
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
                <th>Patient</th>
                {isSuper && <th>Portal</th>}
                <th>Phone</th>
                <th>DOB</th>
                <th>Status</th>
                <th>Signed up</th>
                {isSuper && <th style={{ textAlign: "right" }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {pagination.paginatedItems.map((p) => (
                <tr key={p.uid}>
                  <td>
                    <div className={admin.cellMain}>
                      <div className={admin.cellAvatar} aria-hidden>
                        {(p.firstName?.[0] || p.email?.[0] || "P").toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <Link
                          href={`${adminBase}/patients/${p.uid}`}
                          className={admin.rowLink}
                        >
                          {p.fullName}
                        </Link>
                        <div className={admin.cellSub}>{p.email}</div>
                      </div>
                    </div>
                  </td>
                  {isSuper && (
                    <td>
                      <span className={admin.cellSub} style={{ fontWeight: 600 }}>
                        {portalDisplayName(p.orgSlug || DEFAULT_ORG_SLUG)}
                      </span>
                    </td>
                  )}
                  <td>
                    <span className={admin.cellSub}>
                      {p.phone ? formatPhoneDisplay(p.phone) : "—"}
                    </span>
                  </td>
                  <td>
                    <span className={admin.cellSub}>
                      {p.dob ? formatPatientDob(p.dob) : "—"}
                    </span>
                  </td>
                  <td>
                    <span className={`${admin.statusPill} ${patientStatusClass(p.status)}`}>
                      {p.status}
                    </span>
                  </td>
                  <td>
                    <span className={admin.cellSub}>{formatUsDate(p.createdAtMs)}</span>
                  </td>
                  {isSuper && (
                    <td style={{ textAlign: "right" }}>
                      <div className={admin.rowActions}>
                        <button
                          type="button"
                          className={admin.btnGhost}
                          disabled={busyUid === p.uid || editLoadingUid === p.uid}
                          onClick={() => openEdit(p)}
                        >
                          {editLoadingUid === p.uid ? "Loading…" : "Edit"}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {filtered.length === 0 && patients !== null && (
                <tr>
                  <td colSpan={isSuper ? 7 : 5}>
                    <div className={admin.emptyState}>
                      <div className={admin.emptyStateTitle}>
                        No patients match your search
                      </div>
                      Try clearing the search field.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <TablePagination {...pagination} />
      </div>

      {isSuper && editing && (
        <AdminPatientEditModal
          patient={editing}
          onClose={() => setEditing(null)}
          onSave={(fields) => patchPatient(editing.uid, fields)}
        />
      )}
    </>
  );
}

function patientStatusClass(s) {
  switch (s) {
    case "onboarded":
    case "active":
      return admin.statusOnboarded;
    case "incomplete":
      return admin.statusIncomplete;
    default:
      return admin.statusDeactivated;
  }
}

