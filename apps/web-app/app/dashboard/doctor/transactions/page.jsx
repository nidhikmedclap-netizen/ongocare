// app/dashboard/doctor/transactions/page.jsx
//
// Visit earnings ledger for the signed-in doctor.

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuthUser } from "@/lib/auth/useAuthUser";
import { auth } from "@/lib/firebase/auth";
import { useDoctorDashboardBase } from "../useDoctorBase";
import { formatMoney, formatPaidDate } from "@/lib/billing/money";
import styles from "../../patient/dashboard.module.css";
import tx from "./transactions.module.css";
import TablePagination from "../../_components/TablePagination";
import { usePagination } from "@/lib/ui/usePagination";
import { throwIfApiFailed, userErrorMessage } from "@/lib/ui/userErrorMessage";

export default function DoctorTransactionsPage() {
  const { user } = useAuthUser();
  const doctorBase = useDoctorDashboardBase();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const idToken = await auth.currentUser?.getIdToken();
        if (!idToken) throw new Error("not signed in");
        const res = await fetch("/api/doctor/transactions", {
          headers: { Authorization: `Bearer ${idToken}` },
        });
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
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const payments = report?.payments || [];
  const totals = report?.totals || {};
  const currency = totals.currency || "usd";
  const appointmentPaymentCents = report?.appointmentPaymentCents;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return payments;
    return payments.filter(
      (p) =>
        p.patientName.toLowerCase().includes(q) ||
        p.patientEmail.toLowerCase().includes(q) ||
        (p.type || "").toLowerCase().includes(q),
    );
  }, [payments, query]);

  const pagination = usePagination(filtered, { resetDeps: [query] });

  return (
    <>
      <header className={styles.pageHeader}>
        <div>
          <div className={styles.kicker}>Doctor · Transactions</div>
          <h1 className={styles.pageTitle}>Visit earnings</h1>
          <p className={styles.pageSubtitle}>
            Fixed payment for each completed visit. Admin sets your rate; you
            earn that amount every time you mark an appointment completed.
          </p>
        </div>
      </header>

      <div className={styles.statRow}>
        <StatTile
          tone="slate"
          label="Total earnings"
          value={
            loading
              ? "…"
              : appointmentPaymentCents == null
                ? "—"
                : formatMoney(totals.earningsCents, currency)
          }
          sub={
            appointmentPaymentCents == null
              ? "Visit payment rate not set yet"
              : `${totals.capturedCount ?? 0} paid visit${totals.capturedCount === 1 ? "" : "s"}`
          }
        />
        <StatTile
          tone="green"
          label="Rate per visit"
          value={
            appointmentPaymentCents == null
              ? "—"
              : formatMoney(appointmentPaymentCents, currency)
          }
          sub="Set by admin"
        />
      </div>

      <section className={styles.card} style={{ padding: 0, overflow: "hidden" }}>
        <div className={tx.toolbar}>
          <input
            type="search"
            className={tx.search}
            placeholder="Search by patient or visit type…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search earnings"
          />
        </div>

        {loading ? (
          <p style={{ color: "var(--color-text-muted)", margin: "16px" }}>Loading…</p>
        ) : error ? (
          <p style={{ color: "#b45309", margin: "16px" }}>{error}</p>
        ) : filtered.length === 0 ? (
          <div className={`${styles.empty} ${tx.empty}`}>
            <div className={styles.emptyTitle}>No earnings yet</div>
            <div className={styles.emptyBody}>
              When you complete a visit, your fixed payment will appear here.
            </div>
          </div>
        ) : (
          <>
            <div className={tx.tableWrap}>
              <div className={tx.table}>
                <div className={`${tx.row} ${tx.head}`}>
                  <span className={tx.cell}>Date</span>
                  <span className={tx.cell}>Patient</span>
                  <span className={tx.cell}>Visit type</span>
                  <span className={`${tx.cell} ${tx.amountCell}`}>Your earnings</span>
                </div>
                {pagination.paginatedItems.map((p) => (
                  <div key={p.id} className={tx.row}>
                    <span className={tx.cell} data-label="Date">
                      {formatPaidDate(p.paidAtMs)}
                    </span>
                    <span className={`${tx.cell} ${tx.patientCell}`} data-label="Patient">
                      <Link
                        href={`${doctorBase}/patients/${p.patientUid}`}
                        className={tx.patientLink}
                      >
                        {p.patientName}
                      </Link>
                      {p.patientEmail ? (
                        <span className={tx.patientEmail}>{p.patientEmail}</span>
                      ) : null}
                    </span>
                    <span className={`${tx.cell} ${tx.visitCell}`} data-label="Visit type">
                      {p.type || "Consultation"}
                    </span>
                    <span
                      className={`${tx.cell} ${tx.amountCell}`}
                      data-label="Your earnings"
                    >
                      {formatMoney(p.amountCents, p.currency || currency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <TablePagination {...pagination} />
          </>
        )}

        {appointmentPaymentCents == null && !loading && payments.length > 0 && (
          <p
            style={{
              margin: "0 16px 16px",
              color: "var(--color-text-muted)",
              fontSize: 13,
            }}
          >
            Your per-visit payment rate hasn&apos;t been set yet. Contact admin.
          </p>
        )}
      </section>
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
        <DollarIcon />
      </div>
      <div className={styles.statBody}>
        <div className={styles.statLabel}>{label}</div>
        <div className={styles.statValue}>{value}</div>
        <div className={styles.statSub}>{sub}</div>
      </div>
    </div>
  );
}

function DollarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}
