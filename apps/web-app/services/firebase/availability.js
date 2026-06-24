// services/firebase/availability.js
//
// Read/write helpers for the `availability/{doctorUid}` collection that
// drives the patient-facing slot picker. Schema:
//
//   availability/{doctorUid}
//   ├── doctorUid             string — equals the document id
//   ├── weeklySchedule        map    — day → [{ start: "HH:mm", end: "HH:mm" }]
//   ├── slotDurationMinutes   number — 10–30, default 30
//   ├── blockedDates          array  — ISO YYYY-MM-DD strings
//   ├── timezone              string — IANA, defaults "America/New_York"
//   └── updatedAt             timestamp
//
// All time strings are 24h HH:mm in the doctor's stated timezone.

import { FieldValue } from "firebase-admin/firestore";
import { normalizeSlotDurationMinutes } from "@/lib/appointments/slotDuration";
import { formatUsDate } from "@/lib/dates/usDate";
import { timezoneForDoctorHomeState } from "@/lib/doctor/homeState";
import { isAllowedDoctorTimezone } from "@/lib/geo/usTimezones";
import { adminDb } from "@/lib/firebase/admin";

const COLLECTION = "availability";

export const DAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export const DAY_LABELS = {
  sunday: "Sunday",
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
};

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;

function emptyWeek() {
  return DAY_KEYS.reduce((acc, k) => {
    acc[k] = [];
    return acc;
  }, {});
}

export function defaultAvailability(homeState) {
  // Reasonable default — clinician works Mon-Fri, 9-12 and 14-17, 30 min slots.
  const week = emptyWeek();
  const businessDays = ["monday", "tuesday", "wednesday", "thursday", "friday"];
  for (const d of businessDays) {
    week[d] = [
      { start: "09:00", end: "12:00" },
      { start: "14:00", end: "17:00" },
    ];
  }
  return {
    weeklySchedule: week,
    slotDurationMinutes: 30,
    blockedDates: [],
    timezone: timezoneForDoctorHomeState(homeState),
  };
}

export function sanitizeAvailability(input = {}, { homeState } = {}) {
  const week = emptyWeek();
  const inWeek =
    input.weeklySchedule && typeof input.weeklySchedule === "object"
      ? input.weeklySchedule
      : {};
  for (const day of DAY_KEYS) {
    const ranges = Array.isArray(inWeek[day]) ? inWeek[day] : [];
    week[day] = ranges
      .map((r) => ({
        start: typeof r?.start === "string" ? r.start : "",
        end: typeof r?.end === "string" ? r.end : "",
      }))
      .filter((r) => HHMM.test(r.start) && HHMM.test(r.end) && r.start < r.end);
  }

  const slotDurationMinutes = normalizeSlotDurationMinutes(
    input.slotDurationMinutes,
  );

  const blockedDates = Array.isArray(input.blockedDates)
    ? Array.from(
        new Set(
          input.blockedDates
            .filter((d) => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)),
        ),
      ).sort()
    : [];

  const timezone = homeState
    ? timezoneForDoctorHomeState(homeState)
    : isAllowedDoctorTimezone(input.timezone)
      ? input.timezone
      : "America/New_York";

  return { weeklySchedule: week, slotDurationMinutes, blockedDates, timezone };
}

export async function getAvailability(doctorUid) {
  const snap = await adminDb.collection(COLLECTION).doc(doctorUid).get();
  if (!snap.exists) return null;
  return { doctorUid, ...snap.data() };
}

export async function getOrDefaultAvailability(doctorUid, { homeState } = {}) {
  const existing = await getAvailability(doctorUid);
  const raw = existing
    ? {
        weeklySchedule: existing.weeklySchedule,
        slotDurationMinutes: existing.slotDurationMinutes,
        blockedDates: existing.blockedDates,
        timezone: existing.timezone,
      }
    : defaultAvailability(homeState);
  const clean = sanitizeAvailability(raw, { homeState });
  return { doctorUid, ...clean };
}

export async function setAvailability(doctorUid, input, { homeState } = {}) {
  const clean = sanitizeAvailability(input, { homeState });
  await adminDb.collection(COLLECTION).doc(doctorUid).set(
    { doctorUid, ...clean, updatedAt: FieldValue.serverTimestamp() },
    { merge: true },
  );
  return clean;
}

/* ───── Slot generation ───── */

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function fromMinutes(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function dateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Generate every slot a doctor could offer over the next `daysAhead` days.
 *
 *   bookedSet: Set of `${date}|${time}` strings for that doctor.
 *   options.includeBooked: when true, booked slots are included with
 *     `booked: true` so the picker can show them as unavailable.
 *
 * Returns an array of `{ date, time, label, booked? }` in chronological order.
 * Slots in the past are filtered out.
 */
export function generateSlots(
  availability,
  bookedSet = new Set(),
  daysAhead = 21,
  options = {},
) {
  if (!availability) return [];
  const { includeBooked = false } = options;
  const { weeklySchedule, slotDurationMinutes, blockedDates } = availability;
  const blocked = new Set(blockedDates || []);
  const out = [];
  const now = new Date();
  const todayKey = dateKey(now);

  for (let offset = 0; offset < daysAhead; offset++) {
    const d = new Date(now);
    d.setDate(d.getDate() + offset);
    const key = dateKey(d);
    if (blocked.has(key)) continue;
    const dayName = DAY_KEYS[d.getDay()];
    const ranges = weeklySchedule[dayName] || [];

    for (const range of ranges) {
      const startMin = toMinutes(range.start);
      const endMin = toMinutes(range.end);
      for (let m = startMin; m + slotDurationMinutes <= endMin; m += slotDurationMinutes) {
        const time = fromMinutes(m);
        const slotKey = `${key}|${time}`;
        const isBooked = bookedSet.has(slotKey);
        if (isBooked && !includeBooked) continue;

        // Skip slots earlier than now on today's date
        if (key === todayKey) {
          const slotDate = new Date(d);
          const [h, mm] = time.split(":").map(Number);
          slotDate.setHours(h, mm, 0, 0);
          if (slotDate.getTime() <= now.getTime()) continue;
        }

        const label = `${formatUsDate(key)} · ${formatTimeLabel(time)}`;

        out.push({
          date: key,
          time,
          label,
          ...(isBooked ? { booked: true } : {}),
        });
      }
    }
  }
  return out;
}

function formatTimeLabel(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}
