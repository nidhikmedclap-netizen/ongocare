// app/dashboard/doctor/patients/page.jsx
//
// Doctor's patient roster. List with quick search and summary chips per
// patient (plan, paid status, BMI, age). Clicking a row opens the detail
// page at /dashboard/doctor/patients/[uid].

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuthUser } from "@/lib/auth/useAuthUser";
import { auth } from "@/lib/firebase/auth";
import { useDoctorDashboardBase } from "../useDoctorBase";
import styles from "../../patient/dashboard.module.css";
import local from "./patients.module.css";
import TablePagination from "../../_components/TablePagination";
import { usePagination } from "@/lib/ui/usePagination";
import { formatIsoDateUs } from "@/lib/dates/usDate";
import { compareAppointmentsAsc } from "@/lib/appointments/sort";
import { throwIfApiFailed, userErrorMessage } from "@/lib/ui/userErrorMessage";

const PLAN_LABELS = {
  "1m": "1-month",
  "3m": "3-month",
  "6m": "6-month",
};

const OUTREACH_OPTIONS = ["Email", "SMS", "Text"];

export default function DoctorPatientsPage() {
  const doctorBase = useDoctorDashboardBase();
  const { user } = useAuthUser();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("upcoming"); // paid-only roster: upcoming | all
  /** Per-patient outreach channel — local until persisted to comms. */
  const [outreachByUid, setOutreachByUid] = useState({});

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const idToken = await auth.currentUser?.getIdToken();
        const res = await fetch("/api/doctor/patients", {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        const data = await res.json();
        if (cancelled) return;
        throwIfApiFailed(data, "load");
        setRows(data.patients || []);
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = rows.filter((p) => {
      if (filter === "upcoming" && !p.nextAppointment) return false;
      if (!q) return true;
      return (
        (p.fullName || "").toLowerCase().includes(q) ||
        (p.email || "").toLowerCase().includes(q) ||
        (p.phone || "").toLowerCase().includes(q)
      );
    });
    if (filter === "upcoming") {
      return [...list].sort((a, b) =>
        compareAppointmentsAsc(a.nextAppointment, b.nextAppointment),
      );
    }
    return list;
  }, [rows, filter, query]);

  const pagination = usePagination(filtered, {
    resetDeps: [query, filter],
  });

  const counts = useMemo(() => {
    let upcoming = 0;
    for (const p of rows) {
      if (p.nextAppointment) upcoming++;
    }
    return { all: rows.length, upcoming };
  }, [rows]);

  return (
    <>
      <header className={styles.pageHeader}>
        <div>
          <div className={styles.kicker}>Doctor · Patients</div>
          <h1 className={styles.pageTitle}>Patients</h1>
          <p className={styles.pageSubtitle}>
            Patients assigned to you. Click a row to see their full intake.
          </p>
        </div>
      </header>

      <div className={local.toolbar}>
        <div className={local.tabs} role="tablist">
          <Tab label="All patients" count={counts.all} active={filter === "all"} onClick={() => setFilter("all")} />
          <Tab label="Has upcoming" count={counts.upcoming} active={filter === "upcoming"} onClick={() => setFilter("upcoming")} />
        </div>
        <input
          type="search"
          className={local.search}
          placeholder="Search by name, email, or phone…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <section className={styles.card}>
          <p style={{ color: "var(--color-text-muted)", margin: 0 }}>Loading patients…</p>
        </section>
      ) : error ? (
        <section className={styles.card}>
          <p style={{ color: "#b45309", margin: 0 }}>Couldn&apos;t load: {error}</p>
        </section>
      ) : filtered.length === 0 ? (
        <section className={styles.card}>
          <div className={styles.empty}>
            <div className={styles.emptyIllus}><UsersIcon /></div>
            <div className={styles.emptyTitle}>
              {rows.length === 0 ? "No patients yet" : "No matches"}
            </div>
            <div className={styles.emptyBody}>
              {rows.length === 0
                ? "Patients who completed checkout will appear here."
                : "Try clearing your search or switching tabs."}
            </div>
          </div>
        </section>
      ) : (
        <section className={styles.card} style={{ padding: 0, overflow: "hidden" }}>
        <div className={local.list}>
          <div className={`${local.row} ${local.head}`}>
            <span>Patient</span>
            <span>Age / Sex</span>
            <span>BMI</span>
            <span>Plan</span>
            <span>Next visit</span>
            <span className={local.notesCol}>Notes</span>
          </div>
          {pagination.paginatedItems.map((p) => (
            <div key={p.uid} className={local.row}>
              <span className={local.patient}>
                <span className={local.initial}>
                  {(p.firstName?.[0] || p.fullName?.[0] || "?").toUpperCase()}
                </span>
                <span style={{ minWidth: 0 }}>
                  <Link
                    href={`${doctorBase}/patients/${p.uid}`}
                    className={local.patientNameLink}
                  >
                    {p.fullName}
                  </Link>
                  <span className={local.patientMeta}>{p.email}</span>
                </span>
              </span>
              <span data-label="Age / Sex">
                {p.age != null ? `${p.age}y` : "—"}
                {p.sex ? ` · ${capitalize(p.sex)}` : ""}
              </span>
              <span data-label="BMI">{p.bmi != null ? p.bmi.toFixed(1) : "—"}</span>
              <span data-label="Plan">{PLAN_LABELS[p.plan] || "—"}</span>
              <span className={local.nextVisit} data-label="Next visit">
                {p.nextAppointment
                  ? `${formatIsoDateUs(p.nextAppointment.date)} · ${formatTime(p.nextAppointment.time)}`
                  : "—"}
              </span>
              <span className={local.notesCol} data-label="Notes">
                <select
                  className={local.notesSelect}
                  value={outreachByUid[p.uid] || ""}
                  aria-label={`Outreach note for ${p.fullName}`}
                  onChange={(event) => {
                    const value = event.target.value;
                    setOutreachByUid((prev) => ({
                      ...prev,
                      [p.uid]: value,
                    }));
                  }}
                  onClick={(event) => event.stopPropagation()}
                >
                  <option value="">Select…</option>
                  {OUTREACH_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </span>
            </div>
          ))}
        </div>
        <TablePagination {...pagination} />
        </section>
      )}
    </>
  );
}

function Tab({ label, count, active, onClick }) {
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

function formatTime(hhmm) {
  if (!hhmm || !/^\d{2}:\d{2}$/.test(hhmm)) return hhmm || "";
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

function capitalize(s) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function UsersIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="9" cy="8" r="4" />
      <path d="M2 21c0-4 3.5-6 7-6s7 2 7 6" />
      <circle cx="17" cy="8" r="3" />
      <path d="M22 20c0-3-2-5-5-5" />
    </svg>
  );
}
