// Curated US IANA timezones for doctor availability scheduling.

import { STATE_TIMEZONE } from "@/lib/geo/stateToTimezone";

const CITY_LABELS = {
  "America/New_York": "New York",
  "America/Detroit": "Detroit",
  "America/Indiana/Indianapolis": "Indianapolis",
  "America/Chicago": "Chicago",
  "America/Denver": "Denver",
  "America/Boise": "Boise",
  "America/Phoenix": "Phoenix",
  "America/Los_Angeles": "Los Angeles",
  "America/Anchorage": "Anchorage",
  "Pacific/Honolulu": "Honolulu",
  "America/Puerto_Rico": "Puerto Rico",
};

const ORDERED = [
  "America/New_York",
  "America/Detroit",
  "America/Indiana/Indianapolis",
  "America/Chicago",
  "America/Denver",
  "America/Boise",
  "America/Phoenix",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "America/Puerto_Rico",
];

const ALLOWED = new Set([
  ...ORDERED,
  ...Object.values(STATE_TIMEZONE),
]);

export const US_DOCTOR_TIMEZONE_OPTIONS = ORDERED.map((value) => ({
  value,
  label: CITY_LABELS[value] || value.split("/").pop().replace(/_/g, " "),
}));

export function isAllowedDoctorTimezone(tz) {
  return typeof tz === "string" && ALLOWED.has(tz);
}
