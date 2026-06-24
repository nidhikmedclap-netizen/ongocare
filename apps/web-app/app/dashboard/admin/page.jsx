// app/dashboard/admin/page.jsx
//
// Admin overview — stat tiles, signups/bookings line chart, doctor-status
// donut, and quick links to the deeper management tables. Pulls everything
// from /api/admin/overview in a single round-trip.

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthUser } from "@/lib/auth/useAuthUser";
import { useAdminApi, useAdminDashboardBase } from "./useAdminApi";
import { AreaLineChart, Donut } from "./Charts";
import { formatUsDate } from "@/lib/dates/usDate";
import { userErrorMessage } from "@/lib/ui/userErrorMessage";
import styles from "../patient/dashboard.module.css";
import admin from "./admin.module.css";

export default function AdminOverviewPage() {
  const { profile, user } = useAuthUser();
  const { fetchAdmin, portalKey } = useAdminApi();
  const adminBase = useAdminDashboardBase();
  const overview = useOverview(user, fetchAdmin, portalKey);
  const counts = overview.counts || {};
  const series = overview.series || [];

  const greetingName = profile?.firstName ? `, ${profile.firstName}` : "";
  const today = formatUsDate(new Date());

  const totalSignups30d = series.reduce((acc, d) => acc + (d.signups || 0), 0);
  const totalBookings30d = series.reduce((acc, d) => acc + (d.bookings || 0), 0);

  const doctorSegments = [
    { label: "Active", value: counts.doctorsActive || 0, color: "var(--color-primary)" },
    { label: "Pending", value: counts.doctorsPending || 0, color: "#f4a261" },
    { label: "Rejected", value: counts.doctorsRejected || 0, color: "var(--color-accent)" },
  ];

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
              <DotIcon /> Admin console · {today}
            </span>
            <h1 className={styles.heroTitle}>
              Welcome back{greetingName}.
            </h1>
            <p className={styles.heroSubtitle}>
              {counts.doctorsPending
                ? `${counts.doctorsPending} doctor application${counts.doctorsPending === 1 ? "" : "s"} waiting on your review.`
                : "Everything's up to date — no pending clinician applications."}
            </p>
          </div>
          <div className={styles.heroActions}>
            <Link href={`${adminBase}/doctors`} className={styles.ctaPrimary}>
              Review doctors <ArrowRight />
            </Link>
            <Link href={`${adminBase}/patients`} className={styles.ctaSecondary}>
              View patients
            </Link>
          </div>
        </div>
      </section>

      {/* ===== Stat tiles ===== */}
      <div className={styles.statRow}>
        <StatTile
          icon={<UsersIcon />}
          tone="green"
          label="Patients"
          value={overview.loading ? "…" : counts.patients ?? 0}
          sub="Total registered"
        />
        <StatTile
          icon={<StethIcon />}
          tone="amber"
          label="Doctors"
          value={overview.loading ? "…" : counts.doctorsTotal ?? 0}
          sub={`${counts.doctorsActive || 0} active · ${counts.doctorsPending || 0} pending`}
        />
        <StatTile
          icon={<CalendarIcon />}
          tone="coral"
          label="Appointments"
          value={overview.loading ? "…" : counts.appointmentsTotal ?? 0}
          sub={`${counts.appointmentsScheduled || 0} upcoming`}
        />
        <StatTile
          icon={<TrendIcon />}
          tone="slate"
          label="Last 30 days"
          value={overview.loading ? "…" : totalSignups30d}
          sub={`signups · ${totalBookings30d} bookings`}
        />
      </div>

      {/* ===== Charts ===== */}
      <div className={admin.overviewGrid}>
        <section className={admin.chartCard}>
          <div className={admin.chartHeader}>
            <div>
              <h2 className={admin.chartTitle}>Activity — last 30 days</h2>
              <p className={admin.chartSub}>
                Daily new signups and new bookings.
              </p>
            </div>
            <div className={admin.chartLegend}>
              <span className={`${admin.legendDot} ${admin.legendGreen}`}>Signups</span>
              <span className={`${admin.legendDot} ${admin.legendAmber}`}>Bookings</span>
            </div>
          </div>
          {overview.loading ? (
            <div style={{ height: 220, display: "grid", placeItems: "center", color: "var(--color-text-muted)" }}>
              Loading chart…
            </div>
          ) : (
            <AreaLineChart data={series} />
          )}
        </section>

        <section className={admin.chartCard}>
          <div className={admin.chartHeader}>
            <div>
              <h2 className={admin.chartTitle}>Doctor status</h2>
              <p className={admin.chartSub}>Approval pipeline at a glance.</p>
            </div>
          </div>
          <Donut
            segments={doctorSegments}
            centerValue={overview.loading ? "…" : counts.doctorsTotal || 0}
            centerLabel="Doctors"
          />
          <div className={admin.donutLegend}>
            {doctorSegments.map((s) => (
              <div key={s.label} className={admin.donutLegendRow}>
                <span>
                  <span
                    className={admin.donutSwatch}
                    style={{ background: s.color }}
                    aria-hidden
                  />
                  {s.label}
                </span>
                <strong>{s.value}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ===== Appointments summary ===== */}
      <section className={`${styles.card} ${styles.cardHover}`}>
        <div className={styles.cardEyebrow}>
          <CalendarIcon /> Appointments
        </div>
        <h2 className={styles.cardTitle}>Status breakdown</h2>
        <div style={{ marginTop: 12 }}>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Scheduled</span>
            <span className={styles.rowValue}>{counts.appointmentsScheduled ?? 0}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Completed</span>
            <span className={styles.rowValue}>{counts.appointmentsCompleted ?? 0}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Cancelled</span>
            <span className={styles.rowValue}>{counts.appointmentsCancelled ?? 0}</span>
          </div>
        </div>
        <Link
          href={`${adminBase}/appointments`}
          className={styles.ctaSecondary}
          style={{ marginTop: 14 }}
        >
          See all appointments
        </Link>
      </section>
    </>
  );
}

/* ─── Hooks ──────────────────────────────────────────────────────────── */

function useOverview(user, fetchAdmin, portalKey) {
  const [state, setState] = useState({ loading: true });
  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setState({ loading: false });
      return;
    }
    (async () => {
      try {
        const res = await fetchAdmin("/api/admin/overview");
        const data = await res.json();
        if (cancelled) return;
        if (!data?.success) {
          setState({
            loading: false,
            error: userErrorMessage(data, "load"),
          });
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
  }, [user, fetchAdmin, portalKey]);
  return state;
}

/* ─── Bits ───────────────────────────────────────────────────────────── */

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
function StethIcon() {
  return (
    <svg {...iconProps(20)}>
      <path d="M5 3v6a5 5 0 0010 0V3" />
      <line x1="5" y1="3" x2="3" y2="3" />
      <line x1="10" y1="3" x2="12" y2="3" />
      <circle cx="18" cy="15" r="3" />
      <path d="M15 14v-2a4 4 0 00-4-4" />
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
function TrendIcon() {
  return (
    <svg {...iconProps(20)}>
      <polyline points="3 17 9 11 13 15 21 7" />
      <polyline points="15 7 21 7 21 13" />
    </svg>
  );
}
