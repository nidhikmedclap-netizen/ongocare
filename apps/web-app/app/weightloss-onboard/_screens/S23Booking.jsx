"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useOnboard, useScreenContent } from "./OnboardContext";
import {
  convertSlot,
  detectClientTimezone,
  resolvePatientTimezone,
  timezoneAbbreviation,
} from "@/lib/time/timezone";
import { throwIfApiFailed } from "@/lib/ui/userErrorMessage";
import { hasPlanCheckout } from "@/lib/billing/patientPayment";
import { bookOnboardingAppointment } from "../bookAppointment";
import { saveOnboardingProgress } from "../firebaseClient";

/** Refresh open slots every 2 minutes while this screen is open. */
const SLOT_POLL_MS = 120_000;

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const s23Defaults = {
  question: "When would you like to meet your physician?",
  subtitle:
    "Consultations take 10–30 minutes. Pick a date, then choose a time that works for you.",
  loadingText: "Loading your physician's open times…",
  emptyText:
    "No open slots in the next three weeks. We'll get back to you shortly.",
  pickDateHint: "Select a highlighted date to choose a time.",
  timesModalTitle: "Choose a time",
  timesModalSubtitle: "{day}",
  modalCloseLabel: "Close",
  changeTimeLabel: "Change time",
  confirmLabel: "You picked",
  bookedLabel: "Already booked",
  slotTakenError:
    "That time was just booked by someone else. Please pick another slot.",
  tzNoticeTemplate:
    "Times shown in your local timezone ({patient}). Your physician is in {doctor}.",
  doctorTimeNoteTemplate: "Doctor's local time: {doctorTime}",
  ctaLabel: "Confirm appointment",
  ctaChecking: "Checking availability…",
};

async function fetchDoctorSlots(doctorUid) {
  const res = await fetch(`/api/doctors/${doctorUid}/slots`);
  const data = await res.json();
  throwIfApiFailed(data, "load");
  return {
    slots: Array.isArray(data.slots) ? data.slots : [],
    doctorTimezone: data.timezone || "America/New_York",
  };
}

export default function S23Booking() {
  const { form, updateField, goTo } = useOnboard();
  const c = useScreenContent("s23", s23Defaults);
  const [slots, setSlots] = useState(null);
  const [doctorTz, setDoctorTz] = useState("America/New_York");
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [browserTz, setBrowserTz] = useState(null);
  const [selectedDayKey, setSelectedDayKey] = useState("");
  const [slotModalDayKey, setSlotModalDayKey] = useState("");
  const [portalReady, setPortalReady] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  useEffect(() => {
    setBrowserTz(detectClientTimezone());
  }, []);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (doctorTz) updateField("doctorTimezone", doctorTz);
  }, [doctorTz, updateField]);

  const patientTz = useMemo(
    () => resolvePatientTimezone({ state: form.state, browserTz }),
    [form.state, browserTz],
  );

  const loadSlots = useCallback(async () => {
    if (!form.doctorUid) {
      setSlots([]);
      return;
    }
    try {
      const { slots: next, doctorTimezone } = await fetchDoctorSlots(form.doctorUid);
      setSlots(next);
      setDoctorTz(doctorTimezone);
      setError("");

      const selectedKey = form.slot;
      if (selectedKey) {
        const match = next.find((s) => `${s.date}|${s.time}` === selectedKey);
        if (!match || match.booked) {
          updateField("slot", "");
          updateField("slotDate", "");
          updateField("slotTime", "");
          setSelectedDayKey("");
        }
      }
    } catch (e) {
      setError(e?.message || "Couldn't load times.");
      setSlots([]);
    }
  }, [form.doctorUid, form.slot, updateField]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!form.doctorUid) {
        setSlots([]);
        return;
      }
      setSlots(null);
      try {
        const { slots: next, doctorTimezone } = await fetchDoctorSlots(form.doctorUid);
        if (cancelled) return;
        setSlots(next);
        setDoctorTz(doctorTimezone);
        setError("");
      } catch (e) {
        if (cancelled) return;
        setError(e?.message || "Couldn't load times.");
        setSlots([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [form.doctorUid]);

  useEffect(() => {
    if (!form.doctorUid) return undefined;
    const id = setInterval(loadSlots, SLOT_POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") loadSlots();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [form.doctorUid, loadSlots]);

  const decoratedSlots = useMemo(() => {
    if (!slots) return null;
    return slots.map((s) => {
      const view = convertSlot({ date: s.date, time: s.time }, doctorTz, patientTz);
      return { ...s, view };
    });
  }, [slots, doctorTz, patientTz]);

  const { byDay, dayOrder } = useMemo(() => {
    const map = new Map();
    const order = [];
    for (const s of decoratedSlots || []) {
      const dayKey = s.view?.patient?.dateKey || s.date;
      const dayLabel = s.view?.patient?.dayLabel || s.date;
      if (!map.has(dayKey)) {
        map.set(dayKey, { label: dayLabel, entries: [] });
        order.push(dayKey);
      }
      map.get(dayKey).entries.push(s);
    }
    return { byDay: map, dayOrder: order };
  }, [decoratedSlots]);

  useEffect(() => {
    if (!decoratedSlots?.length || !form.slot) return;
    const match = decoratedSlots.find((s) => `${s.date}|${s.time}` === form.slot);
    if (!match) return;
    const key = match.view?.patient?.dateKey || match.date;
    setSelectedDayKey(key);
    const [y, mo] = key.split("-").map(Number);
    setViewDate({ year: y, month: mo - 1 });
  }, [decoratedSlots, form.slot]);

  const monthBounds = useMemo(() => {
    if (!dayOrder.length) return null;
    const sorted = [...dayOrder].sort();
    const [y1, m1] = sorted[0].split("-").map(Number);
    const [y2, m2] = sorted[sorted.length - 1].split("-").map(Number);
    return {
      min: { year: y1, month: m1 - 1 },
      max: { year: y2, month: m2 - 1 },
    };
  }, [dayOrder]);

  const todayKey = useMemo(() => dateKeyFromDate(new Date()), []);

  const availableDayKeys = useMemo(() => {
    const keys = new Set();
    for (const [dayKey, day] of byDay) {
      if (day.entries.some((s) => !s.booked)) keys.add(dayKey);
    }
    return keys;
  }, [byDay]);

  const calendarCells = useMemo(
    () => buildMonthCells(viewDate.year, viewDate.month),
    [viewDate.year, viewDate.month],
  );

  const selectedDay = selectedDayKey ? byDay.get(selectedDayKey) : null;
  const slotModalDay = slotModalDayKey ? byDay.get(slotModalDayKey) : null;

  const tzNotice = useMemo(() => {
    if (!doctorTz || !patientTz || doctorTz === patientTz) return "";
    const patientAbbr = timezoneAbbreviation(Date.now(), patientTz);
    const doctorAbbr = timezoneAbbreviation(Date.now(), doctorTz);
    return c.tzNoticeTemplate
      .replace("{patient}", patientAbbr)
      .replace("{doctor}", doctorAbbr);
  }, [doctorTz, patientTz, c.tzNoticeTemplate]);

  const handleConfirm = async () => {
    if (!form.slot || !form.doctorUid) return;
    setConfirming(true);
    setError("");
    try {
      const { slots: fresh, doctorTimezone } = await fetchDoctorSlots(form.doctorUid);
      setSlots(fresh);
      setDoctorTz(doctorTimezone);
      const match = fresh.find((s) => `${s.date}|${s.time}` === form.slot);
      if (!match || match.booked) {
        updateField("slot", "");
        updateField("slotDate", "");
        updateField("slotTime", "");
        setError(c.slotTakenError);
        return;
      }
      if (hasPlanCheckout(form)) {
        const booking = await bookOnboardingAppointment(form);
        if (booking.reason === "slot_taken") {
          updateField("slot", "");
          updateField("slotDate", "");
          updateField("slotTime", "");
          setError(c.slotTakenError);
          return;
        }
        if (!booking.ok && !booking.skipped) {
          setError(booking.message || "Could not book your appointment.");
          return;
        }
        await saveOnboardingProgress(
          form,
          "iConfirm",
          "onboarded",
          form.orgSlug || "",
        );
        goTo("iConfirm");
        return;
      }
      goTo("sPlan");
    } catch (e) {
      setError(e?.message || "Couldn't verify that slot.");
    } finally {
      setConfirming(false);
    }
  };

  const selectDay = (dayKey) => {
    if (!availableDayKeys.has(dayKey)) return;
    setSelectedDayKey(dayKey);
    if (form.slot) {
      const match = decoratedSlots?.find((s) => `${s.date}|${s.time}` === form.slot);
      const slotDayKey = match?.view?.patient?.dateKey || match?.date;
      if (slotDayKey !== dayKey) {
        updateField("slot", "");
        updateField("slotDate", "");
        updateField("slotTime", "");
      }
    }
    setError("");
    setSlotModalDayKey(dayKey);
  };

  const closeSlotModal = () => setSlotModalDayKey("");

  const selectSlot = (s) => {
    if (s.booked) return;
    const slotId = `${s.date}|${s.time}`;
    updateField("slot", slotId);
    updateField("slotDate", s.date);
    updateField("slotTime", s.time);
    setError("");
    closeSlotModal();
  };

  useEffect(() => {
    if (!slotModalDayKey) return undefined;
    const onKeyDown = (e) => {
      if (e.key === "Escape") closeSlotModal();
    };
    document.body.classList.add("wlf-modal-open");
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.classList.remove("wlf-modal-open");
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [slotModalDayKey]);

  const canGoPrev =
    monthBounds &&
    (viewDate.year > monthBounds.min.year ||
      (viewDate.year === monthBounds.min.year && viewDate.month > monthBounds.min.month));

  const canGoNext =
    monthBounds &&
    (viewDate.year < monthBounds.max.year ||
      (viewDate.year === monthBounds.max.year && viewDate.month < monthBounds.max.month));

  const goPrevMonth = () => {
    if (!canGoPrev) return;
    setViewDate((d) => {
      const month = d.month === 0 ? 11 : d.month - 1;
      const year = d.month === 0 ? d.year - 1 : d.year;
      return { year, month };
    });
  };

  const goNextMonth = () => {
    if (!canGoNext) return;
    setViewDate((d) => {
      const month = d.month === 11 ? 0 : d.month + 1;
      const year = d.month === 11 ? d.year + 1 : d.year;
      return { year, month };
    });
  };

  const availableCount = (decoratedSlots || []).filter((s) => !s.booked).length;

  const selectedView = useMemo(() => {
    if (!form.slot || !form.slotDate || !form.slotTime) return null;
    return convertSlot(
      { date: form.slotDate, time: form.slotTime },
      doctorTz,
      patientTz,
    );
  }, [form.slot, form.slotDate, form.slotTime, doctorTz, patientTz]);

  return (
    <div className="sc">
      <div className="q">{c.question}</div>
      <div className="qs">{c.subtitle}</div>

      {tzNotice && (
        <div role="note" className="cal3-tz">
          {tzNotice}
        </div>
      )}

      {slots === null && (
        <div className="qs" style={{ marginTop: 14 }}>
          {c.loadingText}
        </div>
      )}

      {slots && availableCount === 0 && !error && (
        <div className="qs" style={{ marginTop: 14 }}>
          {c.emptyText}
        </div>
      )}

      {error && (
        <div className="qs" style={{ marginTop: 14, color: "#b45309" }}>
          {error}
        </div>
      )}

      {slots && availableCount > 0 && (
        <div className="cal3">
          <div className="cal3-nav">
            <button
              type="button"
              className="cal3-nav-btn"
              onClick={goPrevMonth}
              disabled={!canGoPrev}
              aria-label="Previous month"
            >
              ‹
            </button>
            <div className="cal3-month">
              {MONTH_LABELS[viewDate.month]} {viewDate.year}
            </div>
            <button
              type="button"
              className="cal3-nav-btn"
              onClick={goNextMonth}
              disabled={!canGoNext}
              aria-label="Next month"
            >
              ›
            </button>
          </div>

          <div className="cal3-dow">
            {WEEKDAY_LABELS.map((label) => (
              <span key={label} className="cal3-dow-cell">
                {label}
              </span>
            ))}
          </div>

          <div className="cal3-grid">
            {calendarCells.map((cell, idx) => {
              if (cell.type === "pad") {
                return <span key={`pad-${idx}`} className="cal3-pad" aria-hidden />;
              }
              const { dateKey, day } = cell;
              const isAvailable = availableDayKeys.has(dateKey);
              const isSelected = selectedDayKey === dateKey;
              const isToday = dateKey === todayKey;
              return (
                <button
                  key={dateKey}
                  type="button"
                  className={`cal3-day ${isAvailable ? "available" : ""} ${isSelected ? "sel" : ""} ${isToday ? "today" : ""}`}
                  disabled={!isAvailable}
                  aria-pressed={isSelected}
                  aria-label={
                    isAvailable
                      ? `${MONTH_LABELS[viewDate.month]} ${day}, available`
                      : `${MONTH_LABELS[viewDate.month]} ${day}, unavailable`
                  }
                  onClick={() => selectDay(dateKey)}
                >
                  <span className="cal3-day-num">{day}</span>
                  {isAvailable && <span className="cal3-day-dot" aria-hidden />}
                </button>
              );
            })}
          </div>

          {!form.slot && (
            <p className="cal3-hint">{c.pickDateHint}</p>
          )}

          {form.slot && selectedDay && (
            <p className="cal3-hint cal3-hint-selected">
              Selected: <strong>{selectedDay.label}</strong>
              {" · "}
              <button
                type="button"
                className="cal3-change-time"
                onClick={() => setSlotModalDayKey(selectedDayKey)}
              >
                {c.changeTimeLabel}
              </button>
            </p>
          )}
        </div>
      )}

      {portalReady &&
        slotModalDay &&
        createPortal(
          <div className="wlf-root wlf-modal-portal">
            <div
              className="cal3-modal-overlay"
              role="presentation"
              onClick={closeSlotModal}
            >
              <div
                className="cal3-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="cal3-slot-modal-title"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="cal3-modal-handle" aria-hidden />
                <div className="cal3-modal-head">
                  <div className="cal3-modal-titles">
                    <h3 id="cal3-slot-modal-title" className="cal3-modal-title">
                      {c.timesModalTitle}
                    </h3>
                    <p className="cal3-modal-date">
                      {c.timesModalSubtitle.replace("{day}", slotModalDay.label)}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="cal3-modal-close"
                    onClick={closeSlotModal}
                    aria-label={c.modalCloseLabel}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                      <path
                        d="M1 1l12 12M13 1L1 13"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </div>
                <div className="cal2-times cal3-modal-times">
                  {slotModalDay.entries.map((s) => {
                    const slotId = `${s.date}|${s.time}`;
                    const isSelected = form.slot === slotId;
                    const isBooked = !!s.booked;
                    const patientLabel =
                      s.view?.patient?.timeLabel || formatTimeLabel(s.time);
                    return (
                      <button
                        key={slotId}
                        type="button"
                        className={`cal2-time cal3-modal-time ${isSelected ? "sel" : ""} ${isBooked ? "booked" : ""}`}
                        disabled={isBooked}
                        aria-disabled={isBooked}
                        aria-pressed={isSelected}
                        title={
                          s.view && !s.view.sameWallTime
                            ? `${s.view.doctor.timeLabel} ${s.view.doctor.abbr} (doctor's local time)`
                            : undefined
                        }
                        onClick={() => selectSlot(s)}
                      >
                        <span className="cal3-modal-time-label">{patientLabel}</span>
                        {isBooked && (
                          <span className="cal2-time-status">{c.bookedLabel}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {form.slot && selectedView && (
        <div className="cal2-confirm">
          <span className="cal2-confirm-icon">✓</span>
          <span>
            {c.confirmLabel}{" "}
            <strong>
              {selectedView.patient.dayLabel} · {selectedView.patient.timeLabel}{" "}
              {selectedView.patient.abbr}
            </strong>
            {!selectedView.sameWallTime && (
              <>
                <br />
                <span style={{ fontSize: 12.5, opacity: 0.8 }}>
                  {c.doctorTimeNoteTemplate.replace(
                    "{doctorTime}",
                    `${selectedView.doctor.timeLabel} ${selectedView.doctor.abbr}`,
                  )}
                </span>
              </>
            )}
          </span>
        </div>
      )}

      <button
        type="button"
        className="cta"
        disabled={!form.slot || confirming}
        onClick={handleConfirm}
      >
        {confirming ? c.ctaChecking : c.ctaLabel}
      </button>
    </div>
  );
}

function dateKeyFromDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function buildMonthCells(year, month) {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startPad = first.getDay();
  const cells = [];
  for (let i = 0; i < startPad; i++) {
    cells.push({ type: "pad" });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    cells.push({ type: "day", day, dateKey });
  }
  return cells;
}

function formatTimeLabel(hhmm) {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}
