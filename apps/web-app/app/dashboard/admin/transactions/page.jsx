// app/dashboard/admin/transactions/page.jsx
//
// Plan signup payments + doctor visit earnings summaries.

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAdminApi, useAdminDashboardBase } from "../useAdminApi";
import { useAuthUser } from "@/lib/auth/useAuthUser";
import { portalFilterLabel, portalDisplayName } from "@/lib/admin/portals";
import { formatMoney, formatPaidDate, PLAN_LABELS } from "@/lib/billing/money";
import { PAYMENT_STATUS } from "@/lib/billing/stripePayment";
import styles from "../../patient/dashboard.module.css";
import admin from "../admin.module.css";
import TablePagination from "../../_components/TablePagination";
import { usePagination } from "@/lib/ui/usePagination";
import { throwIfApiFailed, userErrorMessage } from "@/lib/ui/userErrorMessage";

export default function AdminTransactionsPage() {
  const { role } = useAuthUser();
  const isSuper = role === "superadmin";
  const adminBase = useAdminDashboardBase();
  const { fetchAdmin, portalKey, selectedPortal, hydrated } = useAdminApi();
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("patients");

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchAdmin("/api/admin/transactions");
        const data = await res.json();
        if (cancelled) return;
        throwIfApiFailed(data, "load");
        setReport(data);
        setError("");
      } catch (e) {
        if (!cancelled) {
          setError(userErrorMessage(e, "load"));
          setReport(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [portalKey, hydrated, fetchAdmin]);

  const payments = report?.payments || [];
  const doctorSummaries = report?.doctorSummaries || [];
  const totals = report?.totals || {};
  const currency = totals.currency || "usd";
  const showPortal = isSuper && (!selectedPortal || selectedPortal === "all");

  const filteredPayments = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return payments;
    return payments.filter(
      (p) =>
        (p.patientName || "").toLowerCase().includes(q) ||
        (p.patientEmail || "").toLowerCase().includes(q) ||
        (p.doctorName || "").toLowerCase().includes(q) ||
        (portalDisplayName(p.orgSlug) || "").toLowerCase().includes(q),
    );
  }, [payments, query]);

  const filteredDoctors = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return doctorSummaries;
    return doctorSummaries.filter(
      (d) =>
        (d.doctorName || "").toLowerCase().includes(q) ||
        (portalDisplayName(d.orgSlug) || "").toLowerCase().includes(q),
    );
  }, [doctorSummaries, query]);

  const paymentsPagination = usePagination(filteredPayments, {
    resetDeps: [query, tab],
  });
  const doctorsPagination = usePagination(filteredDoctors, {
    resetDeps: [query, tab],
  });

  const portalLabel = isSuper ? portalFilterLabel(selectedPortal) : null;

  return (
    <>
      <header className={styles.pageHeader}>
        <div>
          <div className={styles.kicker}>Admin · Transactions</div>
          <h1 className={styles.pageTitle}>Plan payments</h1>
          <p className={styles.pageSubtitle}>
            {isSuper
              ? `Program signup charges${portalLabel ? ` · ${portalLabel}` : ""}. Visits are not billed separately.`
              : "Your portal's program signup payments and doctor visit earnings."}
          </p>
        </div>
      </header>

      <div className={styles.statRow}>
        <StatTile
          tone="green"
          label="Patient payments"
          value={formatMoney(totals.grossCents, currency)}
          sub={`${totals.capturedCount ?? totals.paymentCount ?? 0} captured · ${totals.authorizedCount ?? 0} authorized`}
        />
        <StatTile
          tone="amber"
          label="Doctor visit earnings"
          value={formatMoney(totals.appointmentEarningsCents, currency)}
          sub={`${doctorSummaries.length} doctor${doctorSummaries.length === 1 ? "" : "s"} with paid visits`}
        />
      </div>

      <div className={admin.tableCard}>
        <div className={admin.tableToolbar}>
          <div className={admin.tabRow}>
            <TabButton
              label="Patient payments"
              count={payments.length}
              active={tab === "patients"}
              onClick={() => setTab("patients")}
            />
            <TabButton
              label="Doctor earnings"
              count={doctorSummaries.length}
              active={tab === "doctors"}
              onClick={() => setTab("doctors")}
            />
          </div>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              tab === "patients"
                ? "Search patient, doctor, portal…"
                : "Search doctor or portal…"
            }
            className={admin.searchInput}
          />
        </div>

        {error && (
          <p style={{ color: "#b45309", margin: "0 0 12px" }}>{error}</p>
        )}

        {!report ? (
          <p style={{ color: "var(--color-text-muted)", margin: 0 }}>Loading…</p>
        ) : tab === "patients" ? (
          <div className={admin.tableScroll}>
            <table className={admin.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Patient</th>
                  <th>Doctor</th>
                  {showPortal && <th>Portal</th>}
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={showPortal ? 7 : 6} className={admin.tableEmpty}>
                      No plan payments found.
                    </td>
                  </tr>
                ) : (
                  paymentsPagination.paginatedItems.map((p) => (
                    <tr key={p.id}>
                      <td>{formatPaidDate(p.paidAtMs)}</td>
                      <td>
                        <Link href={`${adminBase}/patients/${p.patientUid}`} className={admin.rowLink}>
                          {p.patientName}
                        </Link>
                        <div className={admin.tableMeta}>{p.patientEmail}</div>
                      </td>
                      <td>
                        {p.doctorUid ? (
                          <Link href={`${adminBase}/doctors/${p.doctorUid}`} className={admin.rowLink}>
                            {p.doctorName}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      {showPortal && <td>{portalDisplayName(p.orgSlug)}</td>}
                      <td>{PLAN_LABELS[p.plan] || p.plan || "—"}</td>
                      <td>
                        <span
                          className={`${styles.pill} ${
                            p.paymentStatus === PAYMENT_STATUS.CAPTURED
                              ? styles.pillOk
                              : styles.pillWarn
                          }`}
                        >
                          {p.paymentStatus === PAYMENT_STATUS.CAPTURED
                            ? "Paid"
                            : "Authorized"}
                        </span>
                      </td>
                      <td style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
                        {formatMoney(p.amountCents, p.currency || currency)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <TablePagination {...paymentsPagination} />
          </div>
        ) : (
          <div className={admin.tableScroll}>
            <table className={admin.table}>
              <thead>
                <tr>
                  <th>Doctor</th>
                  {showPortal && <th>Portal</th>}
                  <th>Paid visits</th>
                  <th>Rate per visit</th>
                  <th>Total earnings</th>
                </tr>
              </thead>
              <tbody>
                {filteredDoctors.length === 0 ? (
                  <tr>
                    <td colSpan={showPortal ? 5 : 4} className={admin.tableEmpty}>
                      No doctor earnings yet.
                    </td>
                  </tr>
                ) : (
                  doctorsPagination.paginatedItems.map((d) => (
                    <tr key={d.doctorUid}>
                      <td>
                        <Link href={`${adminBase}/doctors/${d.doctorUid}`} className={admin.rowLink}>
                          {d.doctorName}
                        </Link>
                      </td>
                      {showPortal && <td>{portalDisplayName(d.orgSlug)}</td>}
                      <td>{d.visitCount ?? 0}</td>
                      <td>
                        {d.appointmentPaymentCents == null
                          ? "—"
                          : formatMoney(d.appointmentPaymentCents, currency)}
                      </td>
                      <td style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
                        {formatMoney(d.earningsCents, currency)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <TablePagination {...doctorsPagination} />
          </div>
        )}
      </div>
    </>
  );
}

function StatTile({ tone, label, value, sub }) {
  const toneClass =
    {
      green: styles.statIconGreen,
      coral: styles.statIconCoral,
      slate: styles.statIconSlate,
      amber: styles.statIconAmber,
    }[tone] || styles.statIconSlate;
  return (
    <div className={styles.stat}>
      <div className={`${styles.statIcon} ${toneClass}`}>
        <ReceiptIcon />
      </div>
      <div className={styles.statBody}>
        <div className={styles.statLabel}>{label}</div>
        <div className={styles.statValue}>{value}</div>
        <div className={styles.statSub}>{sub}</div>
      </div>
    </div>
  );
}

function TabButton({ label, count, active, onClick }) {
  return (
    <button
      type="button"
      className={`${admin.tabBtn} ${active ? admin.tabBtnActive : ""}`}
      onClick={onClick}
    >
      {label}
      <span className={admin.tabCount}>{count}</span>
    </button>
  );
}

function ReceiptIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2Z" />
      <path d="M8 10h8" />
      <path d="M8 14h5" />
    </svg>
  );
}
