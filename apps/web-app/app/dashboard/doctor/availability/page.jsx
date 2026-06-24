// app/dashboard/doctor/availability/page.jsx
//
// Doctor's weekly availability editor. Each day can have multiple
// start/end windows; the doctor sets the slot duration (10–30 min) and
// can block specific calendar dates. Slot length is 10–30 minutes.
// Saves to /api/doctor/availability.

"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuthUser } from "@/lib/auth/useAuthUser";
import { auth } from "@/lib/firebase/auth";
import { stateNameByCode } from "@/data/usStates";
import { timezoneForDoctorHomeState } from "@/lib/doctor/homeState";
import { formatIsoDateUs } from "@/lib/dates/usDate";
import {
  formatTimezoneLabel,
  formatTimezoneShort,
} from "@/lib/time/timezone";
import styles from "../../patient/dashboard.module.css";
import local from "./availability.module.css";
import { SLOT_OPTIONS } from "@/lib/appointments/slotDuration";
import { toastApiError, toastSuccess } from "@/lib/ui/notify";
import { throwIfApiFailed, userErrorMessage } from "@/lib/ui/userErrorMessage";

const DAYS = [
  { key: "monday", label: "Monday", short: "Mon" },
  { key: "tuesday", label: "Tuesday", short: "Tue" },
  { key: "wednesday", label: "Wednesday", short: "Wed" },
  { key: "thursday", label: "Thursday", short: "Thu" },
  { key: "friday", label: "Friday", short: "Fri" },
  { key: "saturday", label: "Saturday", short: "Sat" },
  { key: "sunday", label: "Sunday", short: "Sun" },
];

export default function DoctorAvailabilityPage() {
  const { user } = useAuthUser();
  const [availability, setAvailability] = useState(null);
  const [homeState, setHomeState] = useState("");
  const [licensedStates, setLicensedStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [error, setError] = useState("");
  const [newBlockedDate, setNewBlockedDate] = useState("");

  // Load current availability
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const idToken = await auth.currentUser?.getIdToken();
        const res = await fetch("/api/doctor/availability", {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        const data = await res.json();
        if (cancelled) return;
        throwIfApiFailed(data, "load");
        setAvailability(data.availability);
        setHomeState(data.homeState || "");
        setLicensedStates(data.licensedStates || []);
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

  const totalSlots = useMemo(() => {
    if (!availability) return 0;
    const dur = availability.slotDurationMinutes || 30;
    let n = 0;
    for (const day of DAYS) {
      const ranges = availability.weeklySchedule?.[day.key] || [];
      for (const r of ranges) {
        const s = toMinutes(r.start);
        const e = toMinutes(r.end);
        if (e > s) n += Math.floor((e - s) / dur);
      }
    }
    return n;
  }, [availability]);

  if (loading) {
    return (
      <>
        <Header />
        <section className={styles.card}>
          <p style={{ color: "var(--color-text-muted)", margin: 0 }}>Loading your schedule…</p>
        </section>
      </>
    );
  }

  if (!availability) {
    return (
      <>
        <Header />
        <section className={styles.card}>
          <p style={{ color: "#b45309", margin: 0 }}>
            Couldn&apos;t load your availability{error ? `: ${error}` : ""}.
          </p>
        </section>
      </>
    );
  }

  const updateWeek = (day, ranges) =>
    setAvailability((p) => ({
      ...p,
      weeklySchedule: { ...p.weeklySchedule, [day]: ranges },
    }));

  const addRange = (day) => {
    const ranges = availability.weeklySchedule?.[day] || [];
    updateWeek(day, [...ranges, { start: "09:00", end: "12:00" }]);
  };

  const removeRange = (day, idx) => {
    const ranges = (availability.weeklySchedule?.[day] || []).filter((_, i) => i !== idx);
    updateWeek(day, ranges);
  };

  const updateRange = (day, idx, field, value) => {
    const ranges = [...(availability.weeklySchedule?.[day] || [])];
    ranges[idx] = { ...ranges[idx], [field]: value };
    updateWeek(day, ranges);
  };

  const copyMondayToWeekdays = () => {
    const monday = availability.weeklySchedule?.monday || [];
    setAvailability((p) => ({
      ...p,
      weeklySchedule: {
        ...p.weeklySchedule,
        tuesday: cloneRanges(monday),
        wednesday: cloneRanges(monday),
        thursday: cloneRanges(monday),
        friday: cloneRanges(monday),
      },
    }));
  };

  const clearAll = () => {
    setAvailability((p) => ({
      ...p,
      weeklySchedule: DAYS.reduce((acc, d) => {
        acc[d.key] = [];
        return acc;
      }, {}),
    }));
  };

  const addBlockedDate = () => {
    if (!newBlockedDate || !/^\d{4}-\d{2}-\d{2}$/.test(newBlockedDate)) return;
    setAvailability((p) => ({
      ...p,
      blockedDates: Array.from(new Set([...(p.blockedDates || []), newBlockedDate])).sort(),
    }));
    setNewBlockedDate("");
  };

  const removeBlockedDate = (d) =>
    setAvailability((p) => ({
      ...p,
      blockedDates: (p.blockedDates || []).filter((x) => x !== d),
    }));

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/doctor/availability", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ ...availability, homeState }),
      });
      const data = await res.json();
      throwIfApiFailed(data, "save");
      setAvailability(data.availability);
      setHomeState(data.homeState || homeState);
      setLicensedStates(data.licensedStates || licensedStates);
      setSavedAt(Date.now());
      toastSuccess("Availability saved");
    } catch (e) {
      setError(toastApiError(e, { fallback: "save" }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Header />

      {/* Top summary tile */}
      <div className={styles.statRow}>
        <SummaryTile label="Open slots / week" value={totalSlots} tone="green" />
        <SummaryTile
          label="Slot duration"
          value={`${availability.slotDurationMinutes} min`}
          tone="amber"
        />
        <SummaryTile
          label="Blocked dates"
          value={availability.blockedDates?.length || 0}
          tone="coral"
        />
        <SummaryTile
          label="Home state"
          value={homeState ? stateNameByCode(homeState) : "—"}
          tone="slate"
        />
        <SummaryTile
          label="Local timezone"
          value={formatTimezoneShort(availability.timezone)}
          tone="slate"
        />
      </div>

      {/* Weekly schedule */}
      <section className={styles.card}>
        <div className={local.cardHead}>
          <div>
            <div className={styles.cardEyebrow}>Weekly schedule</div>
            <h2 className={styles.cardTitle}>When are you available?</h2>
            <p className={local.cardDesc}>
              Add one or more windows per day. Slot duration determines how
              consultations are split.
            </p>
          </div>
          <div className={local.quickActions}>
            <button type="button" className={local.btnGhost} onClick={copyMondayToWeekdays}>
              Copy Mon → Tue-Fri
            </button>
            <button type="button" className={local.btnGhost} onClick={clearAll}>
              Clear all
            </button>
          </div>
        </div>

        <div className={local.slotDurationRow}>
          <span className={local.fieldLabel}>Slot duration</span>
          <div className={local.pillGroup}>
            {SLOT_OPTIONS.map((mins) => (
              <button
                key={mins}
                type="button"
                className={`${local.pill} ${availability.slotDurationMinutes === mins ? local.pillActive : ""}`}
                onClick={() =>
                  setAvailability((p) => ({ ...p, slotDurationMinutes: mins }))
                }
              >
                {mins} min
              </button>
            ))}
          </div>
        </div>

        {licensedStates.length > 0 && (
          <div className={local.homeStateRow}>
            <label className={local.homeStateField} htmlFor="doctor-home-state">
              <span className={local.fieldLabel}>Home state</span>
              <select
                id="doctor-home-state"
                className={local.homeStateSelect}
                value={homeState || licensedStates[0] || ""}
                onChange={(e) => {
                  const next = e.target.value;
                  setHomeState(next);
                  setAvailability((p) => ({
                    ...p,
                    timezone: timezoneForDoctorHomeState(next),
                  }));
                }}
              >
                {licensedStates.map((code) => (
                  <option key={code} value={code}>
                    {stateNameByCode(code)} ({code})
                  </option>
                ))}
              </select>
            </label>
            <p className={local.homeStateHint}>
              Your schedule uses{" "}
              <strong>{formatTimezoneLabel(availability.timezone)}</strong> local
              time. Patients in other states see converted times when booking.
            </p>
          </div>
        )}

        <div className={local.availabilityNote} role="note">
          <strong>Important:</strong> You must be available at the times you
          enter below according to your home state local time (
          {formatTimezoneLabel(availability.timezone)}).
        </div>

        <div className={local.week}>
          {DAYS.map((day) => {
            const ranges = availability.weeklySchedule?.[day.key] || [];
            return (
              <div key={day.key} className={local.day}>
                <div className={local.dayHead}>
                  <span className={local.dayLabel}>{day.label}</span>
                  <span className={local.dayCount}>
                    {ranges.length === 0
                      ? "Off"
                      : `${ranges.length} window${ranges.length === 1 ? "" : "s"}`}
                  </span>
                </div>
                <div className={local.ranges}>
                  {ranges.map((r, i) => {
                    const invalid = !r.start || !r.end || r.start >= r.end;
                    return (
                      <div key={i} className={local.range}>
                        <input
                          type="time"
                          className={`${local.timeInput} ${invalid ? local.timeInputErr : ""}`}
                          value={r.start}
                          onChange={(e) => updateRange(day.key, i, "start", e.target.value)}
                        />
                        <span className={local.dash}>→</span>
                        <input
                          type="time"
                          className={`${local.timeInput} ${invalid ? local.timeInputErr : ""}`}
                          value={r.end}
                          onChange={(e) => updateRange(day.key, i, "end", e.target.value)}
                        />
                        <button
                          type="button"
                          className={local.removeBtn}
                          onClick={() => removeRange(day.key, i)}
                          aria-label={`Remove window ${i + 1}`}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    className={local.addRangeBtn}
                    onClick={() => addRange(day.key)}
                  >
                    + Add window
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Blocked dates */}
      <section className={styles.card} style={{ marginTop: 16 }}>
        <div className={styles.cardEyebrow}>Time off</div>
        <h2 className={styles.cardTitle}>Block specific dates</h2>
        <p className={local.cardDesc}>
          Vacation, training, off-days — block them here so patients can&apos;t book
          them. Already-booked appointments aren&apos;t affected.
        </p>

        <div className={local.blockRow}>
          <input
            type="date"
            className={local.input}
            value={newBlockedDate}
            onChange={(e) => setNewBlockedDate(e.target.value)}
            min={new Date().toISOString().slice(0, 10)}
          />
          <button
            type="button"
            className={local.btnPrimary}
            onClick={addBlockedDate}
            disabled={!newBlockedDate}
          >
            Block this date
          </button>
        </div>

        {availability.blockedDates?.length > 0 ? (
          <div className={local.blocks}>
            {availability.blockedDates.map((d) => (
              <span key={d} className={local.blockChip}>
                {formatIsoDateUs(d)}
                <button
                  type="button"
                  onClick={() => removeBlockedDate(d)}
                  aria-label={`Unblock ${d}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p style={{ color: "var(--color-text-soft)", fontSize: 13, margin: "12px 0 0" }}>
            No dates blocked.
          </p>
        )}
      </section>

      {/* Sticky save bar */}
      <div className={local.saveBar}>
        {error && <span className={local.saveError}>⚠ {error}</span>}
        {savedAt && !error && (
          <span className={local.saveOk}>
            Saved · {new Date(savedAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
          </span>
        )}
        <button
          type="button"
          className={local.btnPrimary}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </>
  );
}

function Header() {
  return (
    <header className={styles.pageHeader}>
      <div>
        <div className={styles.kicker}>Doctor · Availability</div>
        <h1 className={styles.pageTitle}>Availability</h1>
        <p className={styles.pageSubtitle}>
          Set the windows patients can book during — all times are in your home
          state local time. These feed the slot picker in real time.
        </p>
      </div>
    </header>
  );
}

function SummaryTile({ label, value, tone }) {
  const toneClass =
    {
      green: styles.statIconGreen,
      coral: styles.statIconCoral,
      slate: styles.statIconSlate,
      amber: styles.statIconAmber,
    }[tone] || styles.statIconSlate;
  return (
    <div className={styles.stat}>
      <div className={`${styles.statIcon} ${toneClass}`} aria-hidden />
      <div className={styles.statBody}>
        <div className={styles.statLabel}>{label}</div>
        <div className={styles.statValue}>{value}</div>
      </div>
    </div>
  );
}

function toMinutes(hhmm) {
  if (!hhmm) return 0;
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function cloneRanges(ranges) {
  return ranges.map((r) => ({ start: r.start, end: r.end }));
}
