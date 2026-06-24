// Doctor home state — the US state whose local time defines when the
// clinician is available. Derived from licensed states; timezone follows
// from state via stateToTimezone.

import { US_STATE_CODES } from "@/data/usStates";
import { timezoneForState } from "@/lib/geo/stateToTimezone";

export function licensedStatesFromLicenses(licenses) {
  const list = Array.isArray(licenses) ? licenses : [];
  return Array.from(
    new Set(
      list
        .map((l) => String(l?.state || "").trim().toUpperCase())
        .filter((code) => US_STATE_CODES.has(code)),
    ),
  );
}

/** First licensed state — used when home state is unset or no longer valid. */
export function inferHomeStateFromLicenses(licenses) {
  const states = licensedStatesFromLicenses(licenses);
  return states[0] || "";
}

/** Returns a two-letter code only when it is one of the doctor's licensed states. */
export function sanitizeHomeStateSelection(homeState, licensedStates) {
  const code = String(homeState || "").trim().toUpperCase();
  if (!code || !US_STATE_CODES.has(code)) return null;
  const allowed = (Array.isArray(licensedStates) ? licensedStates : []).map((s) =>
    String(s).trim().toUpperCase(),
  );
  return allowed.includes(code) ? code : null;
}

export function resolveHomeState({ homeState, licenses, licensedStates } = {}) {
  const allowed = licensedStates || licensedStatesFromLicenses(licenses);
  const fromProfile = sanitizeHomeStateSelection(homeState, allowed);
  if (fromProfile) return fromProfile;
  return inferHomeStateFromLicenses(licenses) || allowed[0] || "";
}

export function timezoneForDoctorHomeState(homeState) {
  return timezoneForState(homeState) || "America/New_York";
}
