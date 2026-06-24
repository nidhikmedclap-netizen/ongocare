// Timezone helpers for appointment scheduling.
//
// The booking flow stores appointment times in the doctor's timezone
// (as YYYY-MM-DD + HH:mm). When showing slots/appointments to a patient,
// we convert those wall times into the patient's timezone (derived from
// their selected state when available) so cross-state bookings are clear.

import {
  timezoneForLicensedStates,
  timezoneForState,
} from "@/lib/geo/stateToTimezone";

const SAFE_FALLBACK_TZ = "America/New_York";

/**
 * The browser's detected IANA timezone. Returns null when called on the
 * server (no Intl resolution happens during SSR for end-users).
 */
export function detectClientTimezone() {
  if (typeof window === "undefined") return null;
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return typeof tz === "string" && tz.length > 0 ? tz : null;
  } catch {
    return null;
  }
}

/** Patient TZ: explicit state selection wins over browser detection. */
export function resolvePatientTimezone({ state, browserTz } = {}) {
  return (
    timezoneForState(state) ||
    browserTz ||
    detectClientTimezone() ||
    SAFE_FALLBACK_TZ
  );
}

/** Doctor TZ: home state wins, then licenses, then stored availability TZ. */
export function resolveDoctorTimezone({
  homeState,
  availabilityTz,
  licensedStates,
} = {}) {
  return (
    timezoneForState(homeState) ||
    timezoneForLicensedStates(licensedStates) ||
    availabilityTz ||
    SAFE_FALLBACK_TZ
  );
}

/**
 * Convert a wall-clock time in `tz` (e.g. "2026-06-01" + "14:00" in
 * America/New_York) into a UTC instant (ms since epoch). Returns null
 * if any input is malformed.
 */
export function zonedWallTimeToInstant(dateStr, timeStr, tz) {
  if (!dateStr || !timeStr) return null;
  const safeTz = tz || SAFE_FALLBACK_TZ;
  const [y, mo, d] = String(dateStr).split("-").map(Number);
  const [h, m] = String(timeStr).split(":").map(Number);
  if ([y, mo, d, h, m].some((n) => !Number.isFinite(n))) return null;

  // Step 1: pretend the wall time is UTC.
  const naiveUtc = Date.UTC(y, mo - 1, d, h, m, 0, 0);

  // Step 2: render that instant *as it would appear in `tz`*.
  let parts;
  try {
    parts = new Intl.DateTimeFormat("en-US", {
      timeZone: safeTz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).formatToParts(new Date(naiveUtc));
  } catch {
    return naiveUtc;
  }

  const map = {};
  for (const p of parts) if (p.type !== "literal") map[p.type] = p.value;
  const tzHour = Number(map.hour) === 24 ? 0 : Number(map.hour);
  const tzAsUtc = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    tzHour,
    Number(map.minute),
    Number(map.second),
  );

  // Step 3: the difference between the two tells us the TZ offset.
  const offset = tzAsUtc - naiveUtc;
  return naiveUtc - offset;
}

/**
 * Format an instant for display in `tz` using `Intl.DateTimeFormat`.
 */
export function formatInTimezone(instantMs, tz, options) {
  if (instantMs == null) return "";
  try {
    return new Intl.DateTimeFormat(undefined, {
      timeZone: tz || SAFE_FALLBACK_TZ,
      ...options,
    }).format(new Date(instantMs));
  } catch {
    return new Intl.DateTimeFormat(undefined, options).format(new Date(instantMs));
  }
}

/**
 * Short timezone abbreviation (e.g. "EDT", "PDT") for a given instant in `tz`.
 * Falls back to the IANA name if abbreviation isn't available.
 */
export function timezoneAbbreviation(instantMs, tz) {
  if (!tz) return "";
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "short",
    }).formatToParts(new Date(instantMs ?? Date.now()));
    const found = parts.find((p) => p.type === "timeZoneName");
    return found ? found.value : tz;
  } catch {
    return tz;
  }
}

function timezoneCityLabel(tz) {
  if (!tz || typeof tz !== "string") return "";
  const leaf = tz.split("/").pop() || tz;
  return leaf.replace(/_/g, " ");
}

/** Compact label for summary tiles — e.g. "ET · Indianapolis". */
export function formatTimezoneShort(tz) {
  if (!tz) return "";
  const abbr = timezoneAbbreviation(Date.now(), tz);
  const city = timezoneCityLabel(tz);
  if (abbr && city && !abbr.includes("/")) return `${abbr} · ${city}`;
  return city || tz;
}

/** Readable label for selects — e.g. "Eastern Time (ET) · Indianapolis". */
export function formatTimezoneLabel(tz) {
  if (!tz) return "";
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "longGeneric",
    }).formatToParts(new Date());
    const generic = parts.find((p) => p.type === "timeZoneName")?.value;
    const abbr = timezoneAbbreviation(Date.now(), tz);
    const city = timezoneCityLabel(tz);
    if (generic && abbr) return `${generic} (${abbr}) · ${city}`;
    if (generic) return `${generic} · ${city}`;
  } catch {
    // fall through
  }
  return formatTimezoneShort(tz);
}

/**
 * Given a slot expressed in the doctor's timezone and the patient's
 * timezone, return a normalized object the UI can render directly.
 *
 *   doctorSlot:  { date: "YYYY-MM-DD", time: "HH:mm" }   ← doctor's wall time
 *   doctorTz:    IANA e.g. "America/New_York"
 *   patientTz:   IANA e.g. "America/Los_Angeles"
 *
 * Returns:
 *   {
 *     instantMs,                ← UTC ms since epoch
 *     patient: { dateKey, dayLabel, timeLabel, abbr },
 *     doctor:  { dateKey, dayLabel, timeLabel, abbr },
 *     sameWallTime: boolean,    ← true if the two TZs render identically
 *   }
 */
export function convertSlot(doctorSlot, doctorTz, patientTz) {
  const instantMs = zonedWallTimeToInstant(doctorSlot?.date, doctorSlot?.time, doctorTz);
  if (instantMs == null) return null;

  const effectivePatientTz = patientTz || doctorTz;

  const patientLabels = wallTimeLabels(instantMs, effectivePatientTz);
  const patient = {
    dateKey: isoDateInTimezone(instantMs, effectivePatientTz),
    ...patientLabels,
  };

  const doctorLabels = wallTimeLabels(instantMs, doctorTz);
  const doctor = {
    dateKey: isoDateInTimezone(instantMs, doctorTz),
    ...doctorLabels,
  };

  return {
    instantMs,
    patient,
    doctor,
    sameWallTime: doctorTz === effectivePatientTz,
  };
}

export function isoDateInTimezone(instantMs, tz) {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz || SAFE_FALLBACK_TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date(instantMs));
    const map = {};
    for (const p of parts) if (p.type !== "literal") map[p.type] = p.value;
    return `${map.year}-${map.month}-${map.day}`;
  } catch {
    return new Date(instantMs).toISOString().slice(0, 10);
  }
}

/** UTC instant for a wall-clock slot stored in the doctor's timezone. */
export function appointmentInstantMs(date, time, doctorTimezone) {
  return zonedWallTimeToInstant(date, time, doctorTimezone || SAFE_FALLBACK_TZ);
}

function wallTimeLabels(instantMs, tz) {
  const safeTz = tz || SAFE_FALLBACK_TZ;
  return {
    dayLabel: formatInTimezone(instantMs, safeTz, {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    }),
    timeLabel: formatInTimezone(instantMs, safeTz, {
      hour: "numeric",
      minute: "2-digit",
    }),
    abbr: timezoneAbbreviation(instantMs, safeTz),
  };
}

/**
 * Format stored appointment wall time for display in a specific IANA timezone.
 */
export function formatWallTimeInTimezone(date, time, tz) {
  const instantMs = appointmentInstantMs(date, time, tz);
  if (instantMs == null) return null;
  const labels = wallTimeLabels(instantMs, tz);
  return {
    instantMs,
    ...labels,
    dateTimeLabel: `${labels.dayLabel} · ${labels.timeLabel} ${labels.abbr}`.trim(),
  };
}

/** Doctor-facing label — uses each appointment's stored doctorTimezone. */
export function formatDoctorAppointmentWhen(appt) {
  const tz = appt?.doctorTimezone || SAFE_FALLBACK_TZ;
  return formatWallTimeInTimezone(appt?.date, appt?.time, tz);
}

/** Admin table — raw doctor wall date/time plus timezone abbreviation. */
export function formatAdminAppointmentWhen(appt) {
  const tz = appt?.doctorTimezone || SAFE_FALLBACK_TZ;
  const view = formatWallTimeInTimezone(appt?.date, appt?.time, tz);
  if (!view) {
    return { dateLabel: appt?.date || "—", timeLabel: appt?.time || "—", tzLabel: "" };
  }
  return {
    dateLabel: view.dayLabel,
    timeLabel: `${view.timeLabel} ${view.abbr}`.trim(),
    tzLabel: formatTimezoneShort(tz),
  };
}
