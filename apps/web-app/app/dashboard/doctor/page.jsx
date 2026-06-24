// app/dashboard/doctor/page.jsx
//
// Doctor Overview — the landing screen after login. Hits /api/doctor/overview
// to pull aggregated stats and recent activity in one round-trip, then renders
// the standard stat-tile grid plus an "Up next" appointment list and a
// "Recent payments" feed.

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthUser } from "@/lib/auth/useAuthUser";
import { useDoctorDashboardBase } from "./useDoctorBase";
import { auth } from "@/lib/firebase/auth";
import { formatUsDate } from "@/lib/dates/usDate";
import { formatDoctorAppointmentWhen } from "@/lib/time/timezone";
import { userErrorMessage } from "@/lib/ui/userErrorMessage";
import styles from "../patient/dashboard.module.css";

export default function DoctorOverviewPage() {
  const { profile, user } = useAuthUser();
  const doctorBase = useDoctorDashboardBase();
  const overview = useOverview(user);

  const greetingName = profile?.firstName
    ? `, Dr. ${profile.firstName}`
    : "";
  const today = formatUsDate(new Date());

  return (
    <>
      {overview.error ? (
        <p role="alert" className={styles.errorBanner} style={{ marginBottom: 16 }}>
          {overview.error}
        </p>
      ) : null}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroText}>
            <span className={styles.heroKicker}>
              <DotIcon /> Doctor dashboard · {today}
            </span>
            <h1 className={styles.heroTitle}>
              Welcome back{greetingName}.
            </h1>
            <p className={styles.heroSubtitle}>
              {overview.upcomingCount > 0
                ? `${overview.upcomingCount} upcoming consultation${overview.upcomingCount === 1 ? "" : "s"} waiting for you.`
                : "No upcoming consultations on the books — a good day to refine your availability."}
            </p>
          </div>
          <div className={styles.heroActions}>
            <Link href={`${doctorBase}/appointments`} className={styles.ctaPrimary}>
              View appointments <ArrowRight />
            </Link>
            <Link href={`${doctorBase}/availability`} className={styles.ctaSecondary}>
              Edit availability
            </Link>
          </div>
        </div>
      </section>

      {/* ===== Stat tiles ===== */}
      <div className={styles.statRow}>
        <StatTile
          icon={<UsersIcon />}
          tone="green"
          label="Assigned patients"
          value={overview.loading ? "…" : overview.assignedPatientsCount ?? 0}
          sub="Patients who picked you"
        />
        <StatTile
          icon={<CalendarIcon />}
          tone="amber"
          label="Upcoming"
          value={overview.loading ? "…" : overview.upcomingCount ?? 0}
          sub={
            overview.todayCount
              ? `${overview.todayCount} today`
              : "Future consultations"
          }
        />
        <StatTile
          icon={<NotePadIcon />}
          tone="coral"
          label="Pending actions"
          value={overview.loading ? "…" : overview.pendingNotesCount ?? 0}
          sub={
            overview.pendingNotesCount
              ? "Sessions without notes"
              : "You're all caught up"
          }
        />
        <StatTile
          icon={<DollarIcon />}
          tone="slate"
          label="Your earnings"
          value={
            overview.loading
              ? "…"
              : formatAmount(overview.earningsCents ?? 0, "usd") || "$0.00"
          }
          sub={
            overview.loading
              ? ""
              : `${overview.recentPayments?.length || 0} recent paid visit${overview.recentPayments?.length === 1 ? "" : "s"}`
          }
        />
      </div>

      <div className={styles.colSplit}>
        {/* Up next */}
        <section className={`${styles.card} ${styles.cardHover}`}>
          <div className={styles.cardEyebrow}>
            <CalendarIcon /> Up next
          </div>
          <h2 className={styles.cardTitle}>Your next consultations</h2>

          {overview.loading ? (
            <p style={muted}>Loading…</p>
          ) : overview.upcoming?.length ? (
            <div style={{ marginTop: 12 }}>
              {overview.upcoming.map((a) => (
                <div key={a.id} className={styles.row}>
                  <span className={styles.rowLabel}>
                    {formatDoctorAppointmentWhen(a)?.dateTimeLabel || "—"}
                  </span>
                  <span className={styles.rowValue}>
                    <strong>{a.patientName}</strong>
                    <br />
                    <span style={muted}>{a.type}</span>
                  </span>
                </div>
              ))}
              <Link
                href={`${doctorBase}/appointments`}
                className={styles.ctaSecondary}
                style={{ marginTop: 12 }}
              >
                See all appointments
              </Link>
            </div>
          ) : (
            <div className={styles.empty}>
              <div className={styles.emptyIllus}>
                <CalendarIcon />
              </div>
              <div className={styles.emptyTitle}>Nothing scheduled</div>
              <div className={styles.emptyBody}>
                Open up your availability so patients can book a slot.
              </div>
            </div>
          )}
        </section>

        {/* Recent visit earnings — fixed amount per completed appointment.
           If the per-visit rate isn't set yet the row value is "—". */}
        <section className={`${styles.card} ${styles.cardHover}`}>
          <div className={styles.cardEyebrow}>
            <DollarIcon /> Recent earnings
          </div>
          <h2 className={styles.cardTitle}>
            From your assigned patients
          </h2>

          {overview.loading ? (
            <p style={muted}>Loading…</p>
          ) : overview.recentPayments?.length ? (
            <div style={{ marginTop: 12 }}>
              {overview.recentPayments.map((p) => (
                <div key={p.patientUid + (p.paidAtMs || "")} className={styles.row}>
                  <span className={styles.rowLabel}>
                    {p.paidAtMs ? formatUsDate(p.paidAtMs) : "—"}
                    <br />
                    <span style={muted}>{p.patientName}</span>
                  </span>
                  <span
                    className={styles.rowValue}
                    style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600 }}
                  >
                    {formatAmount(p.amountCents, p.currency)}
                  </span>
                </div>
              ))}
              <Link
                href={`${doctorBase}/transactions`}
                className={styles.ctaSecondary}
                style={{ marginTop: 12 }}
              >
                See all transactions
              </Link>
              {overview.appointmentPaymentCents == null && (
                <p style={{ ...muted, marginTop: 8 }}>
                  Your per-visit payment rate hasn&apos;t been set yet.
                </p>
              )}
            </div>
          ) : (
            <div className={styles.empty}>
              <div className={styles.emptyIllus}>
                <DollarIcon />
              </div>
              <div className={styles.emptyTitle}>No earnings yet</div>
              <div className={styles.emptyBody}>
                Earnings from patients who selected you will show up here.
              </div>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

const muted = { color: "var(--color-text-muted)", fontSize: 13 };

function useOverview(user) {
  const [state, setState] = useState({ loading: true });

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setState({ loading: false });
      return;
    }
    (async () => {
      try {
        const idToken = await auth.currentUser?.getIdToken();
        if (!idToken) throw new Error("not signed in");
        const res = await fetch("/api/doctor/overview", {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        const data = await res.json();
        if (cancelled) return;
        if (!data?.success) {
          setState({ loading: false, error: userErrorMessage(data, "load") });
          return;
        }
        setState({ loading: false, ...data });
      } catch (e) {
        if (cancelled) return;
        setState({ loading: false, error: userErrorMessage(e, "load") });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  return state;
}

/* ─── Helpers ────────────────────────────────────────────────────────── */

function StatTile({ icon, tone, label, value, sub }) {
  const toneClass =
    {
      green: styles.statIconGreen,
      coral: styles.statIconCoral,
      slate: styles.statIconSlate,
      amber: styles.statIconAmber,
    }[tone] || styles.statIconSlate;
  return (
    <div className={styles.stat}>
      <div className={`${styles.statIcon} ${toneClass}`}>{icon}</div>
      <div className={styles.statBody}>
        <div className={styles.statLabel}>{label}</div>
        <div className={styles.statValue}>{value}</div>
        <div className={styles.statSub}>{sub}</div>
      </div>
    </div>
  );
}

function formatAmount(cents, currency) {
  if (cents == null || !currency) return "";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: String(currency).toUpperCase(),
    }).format(cents / 100);
  } catch {
    return `$${(cents / 100).toFixed(2)}`;
  }
}

/* ─── Icons ──────────────────────────────────────────────────────────── */
function iconProps(size = 16) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };
}

function DotIcon() {
  return (
    <svg {...iconProps(8)}>
      <circle cx="12" cy="12" r="6" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg {...iconProps(14)}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="13 5 20 12 13 19" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg {...iconProps(20)}>
      <circle cx="9" cy="8" r="4" />
      <path d="M2 21c0-4 3.5-6 7-6s7 2 7 6" />
      <circle cx="17" cy="8" r="3" />
      <path d="M22 20c0-3-2-5-5-5" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg {...iconProps(20)}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}

function NotePadIcon() {
  return (
    <svg {...iconProps(20)}>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <line x1="8" y1="8" x2="16" y2="8" />
      <line x1="8" y1="12" x2="16" y2="12" />
      <line x1="8" y1="16" x2="12" y2="16" />
    </svg>
  );
}

function DollarIcon() {
  return (
    <svg {...iconProps(20)}>
      <line x1="12" y1="3" x2="12" y2="21" />
      <path d="M16 7H9.5a2.5 2.5 0 000 5h5a2.5 2.5 0 010 5H8" />
    </svg>
  );
}
