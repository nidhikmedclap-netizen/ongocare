// app/doctor/doctor-onboard/states.js
//
// Doctor-onboard form constants. The state list itself lives in
// data/usStates.js (single source of truth shared with patient onboarding)
// and is re-exported here so existing imports inside this folder don't
// have to change.

export { US_STATES } from "@/data/usStates";

// Common physician license-type designations. Doctor-specific, so it
// stays co-located with the doctor onboarding form rather than moving
// to data/.
export const LICENSE_TYPES = [
  "MD",
  "DO",
  "NP",
  "PA",
  "RN",
  "PharmD",
  "Other",
];
