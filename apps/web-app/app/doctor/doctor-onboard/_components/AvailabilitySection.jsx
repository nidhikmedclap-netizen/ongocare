// Section 6 — home state, slot duration, per-day windows (multiple per day).
// At least one valid window somewhere in the week is required to submit.

import { useMemo } from "react";
import { stateNameByCode } from "@/data/usStates";
import { formatTimezoneLabel } from "@/lib/time/timezone";
import { timezoneForDoctorHomeState } from "@/lib/doctor/homeState";
import styles from "../doctor-onboard.module.css";
import { DAYS, SLOT_OPTIONS } from "../_lib/constants";
import Section from "./Section";

export default function AvailabilitySection({
  values,
  update,
  addDayRange,
  removeDayRange,
  updateDayRange,
  showErrors = false,
  fieldErrors = {},
}) {
  const licensedStates = useMemo(
    () =>
      Array.from(
        new Set(
          (values.licenses || [])
            .map((l) => String(l?.state || "").trim().toUpperCase())
            .filter(Boolean),
        ),
      ),
    [values.licenses],
  );

  const homeTimezone = timezoneForDoctorHomeState(values.homeState);

  return (
    <Section
      number="6"
      title="Weekly availability"
      description="Set your default consultation hours. Add multiple windows per day when you split your day (e.g. morning and afternoon). You can block specific dates from your dashboard later."
    >
      {licensedStates.length > 0 && (
        <div className={styles.homeStateRow}>
          <label className={styles.homeStateField} htmlFor="doctor-home-state">
            <span className={styles.fieldLabel}>Home state</span>
            <select
              id="doctor-home-state"
              className={styles.homeStateSelect}
              value={values.homeState || licensedStates[0] || ""}
              onChange={(e) => update("homeState", e.target.value)}
            >
              {licensedStates.map((code) => (
                <option key={code} value={code}>
                  {stateNameByCode(code)} ({code})
                </option>
              ))}
            </select>
          </label>
          <p className={styles.homeStateHint}>
            Your schedule uses{" "}
            <strong>{formatTimezoneLabel(homeTimezone)}</strong> local time.
            Patients in other states see converted times when booking.
          </p>
        </div>
      )}

      <div className={styles.availabilityNote} role="note">
        <strong>Important:</strong> You must be available at the times you enter
        below according to your home state local time (
        {formatTimezoneLabel(homeTimezone)}).
      </div>

      <div className={styles.slotDurationRow}>
        <span className={styles.fieldLabel}>Slot duration</span>
        <div className={styles.pillGroup}>
          {SLOT_OPTIONS.map((mins) => (
            <button
              key={mins}
              type="button"
              className={`${styles.pill} ${values.slotDurationMinutes === mins ? styles.pillActive : ""}`}
              onClick={() => update("slotDurationMinutes", mins)}
            >
              {mins} min
            </button>
          ))}
        </div>
      </div>

      <div className={styles.weekGrid}>
        {DAYS.map((d) => {
          const ranges = values.availability[d.key]?.ranges || [];
          return (
            <div key={d.key} className={styles.dayCard}>
              <div className={styles.dayCardHead}>
                <span className={styles.dayCardLabel}>{d.label}</span>
                <span className={styles.dayCardCount}>
                  {ranges.length === 0
                    ? "Off"
                    : `${ranges.length} window${ranges.length === 1 ? "" : "s"}`}
                </span>
              </div>
              <div className={styles.dayRanges}>
                {ranges.map((r, i) => {
                  const invalid = !r.start || !r.end || r.start >= r.end;
                  return (
                    <div key={i} className={styles.dayRange}>
                      <input
                        type="time"
                        className={`${styles.rangeTimeInput} ${invalid ? styles.timeInputErr : ""}`}
                        value={r.start}
                        onChange={(e) =>
                          updateDayRange(d.key, i, "start", e.target.value)
                        }
                      />
                      <span className={styles.timeDash}>→</span>
                      <input
                        type="time"
                        className={`${styles.rangeTimeInput} ${invalid ? styles.timeInputErr : ""}`}
                        value={r.end}
                        onChange={(e) =>
                          updateDayRange(d.key, i, "end", e.target.value)
                        }
                      />
                      <button
                        type="button"
                        className={styles.removeRangeBtn}
                        onClick={() => removeDayRange(d.key, i)}
                        aria-label={`Remove ${d.label} window ${i + 1}`}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
                <button
                  type="button"
                  className={styles.addRangeBtn}
                  onClick={() => addDayRange(d.key)}
                >
                  + Add window
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {showErrors && fieldErrors.availability && (
        <p className={styles.fieldHintWarn} style={{ marginTop: 6 }}>
          {fieldErrors.availability}
        </p>
      )}
    </Section>
  );
}
