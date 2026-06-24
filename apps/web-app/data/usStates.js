// data/usStates.js
//
// Canonical US state list for the entire web-app. Two consumers today:
//   1. Doctor onboarding — licensure picker (state someone is licensed in)
//   2. Patient onboarding — profile state dropdown (which state the
//      patient lives in, used to filter the doctor list)
//
// Two-letter codes are USPS abbreviations, matching what state licensure
// boards use and what we persist on user docs:
//   - users/{uid}.licenses[].state         (doctors)
//   - users/{uid}.onboarding.state         (patients)
//
// 50 states + DC + Puerto Rico. If the platform expands to other US
// territories (Guam, USVI, etc.), add them here once — both onboarding
// flows and the doctor matching API will pick them up automatically.

export const US_STATES = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "DC", name: "District of Columbia" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "PR", name: "Puerto Rico" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
];

// O(1) lookup for the validators on the patient-side schema.
export const US_STATE_CODES = new Set(US_STATES.map((s) => s.code));

/**
 * Resolve a 2-letter state code to its full display name. Returns the
 * input (uppercased) if unknown, so we never render an empty string in
 * the fallback notice if state data is missing.
 */
export function stateNameByCode(code) {
  const upper = String(code || "").toUpperCase();
  return US_STATES.find((s) => s.code === upper)?.name || upper;
}
