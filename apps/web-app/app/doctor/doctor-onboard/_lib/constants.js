// app/doctor/doctor-onboard/_lib/constants.js
//
// Shape constants for the doctor registration form: weekly availability
// scaffolding, slot-duration choices, and the initial form state used by
// useDoctorOnboardForm.

export const DAYS = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

import {
  SLOT_DURATION_DEFAULT,
  SLOT_OPTIONS,
} from "@/lib/appointments/slotDuration";

export { SLOT_OPTIONS, SLOT_DURATION_DEFAULT };

const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"];

export const emptyLicense = () => ({
  state: "",
  licenseNumber: "",
  licenseType: "MD",
});

export function defaultAvailability() {
  const out = {};
  for (const d of DAYS) {
    out[d.key] = {
      ranges: WEEKDAYS.includes(d.key)
        ? [{ start: "09:00", end: "17:00" }]
        : [],
    };
  }
  return out;
}

/** Form availability → API weeklySchedule (multiple windows per day). */
export function availabilityToWeeklySchedule(availability) {
  return Object.fromEntries(
    Object.entries(availability || {}).map(([day, cfg]) => {
      const ranges = Array.isArray(cfg?.ranges) ? cfg.ranges : [];
      return [
        day,
        ranges.filter((r) => r.start && r.end && r.start < r.end),
      ];
    }),
  );
}

/** API weeklySchedule → form availability. */
export function weeklyScheduleToFormAvailability(weeklySchedule) {
  const base = defaultAvailability();
  if (!weeklySchedule || typeof weeklySchedule !== "object") return base;

  for (const d of DAYS) {
    const blocks = Array.isArray(weeklySchedule[d.key]) ? weeklySchedule[d.key] : [];
    const valid = blocks.filter((b) => b?.start && b?.end && b.start < b.end);
    base[d.key] = {
      ranges: valid.map((b) => ({ start: b.start, end: b.end })),
    };
  }
  return base;
}

export function initialFormState() {
  return {
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    bio: "",
    licenses: [emptyLicense()],
    homeState: "",
    availability: defaultAvailability(),
    slotDurationMinutes: SLOT_DURATION_DEFAULT,
    banking: {
      accountHolder: "",
      bankName: "",
      accountType: "checking",
      routingNumber: "",
      accountNumber: "",
    },
    consent: false,
  };
}
