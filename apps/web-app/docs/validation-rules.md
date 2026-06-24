# OngoCare Web-App — Validation Rules

Reference for QA / testing. Every rule below is enforced in `apps/web-app`.

Two layers of protection apply to most fields:

1. **Sanitization** — illegal characters are stripped on every keystroke (the user literally cannot type them).
2. **Validation** — values that pass sanitization are still checked against business rules. Continue buttons stay disabled until the screen-level gate is satisfied, and inline error messages appear under each field.

Source of truth: `apps/web-app/app/weightloss-onboard/utils.js`.

---

## 1. Personal info

### First name / Last name (S21, doctor-onboard)
| Rule | Value |
|------|-------|
| Allowed characters | A–Z, a–z, accented letters (À–ÿ, Ā–ž), space, `'`, `-`, `.` |
| Min length | 2 characters |
| Max length | 50 characters |
| Other | First and last chars must be a letter (period also allowed as last char, e.g. `Jr.`); consecutive spaces are collapsed |
| Tries blocked at keystroke | `123`, `@`, `#`, `$`, `<`, `>`, emoji, etc. |
| Error message | "First name must be at least 2 characters." / "Last name must be at least 2 characters." |

**Test cases**
- ✅ `John`, `O'Connor`, `Mary-Jane`, `José`, `Søren`, `Jr.`
- ❌ `J` (too short) → button disabled
- ❌ `John123` → digits are stripped on type; result `John` is valid
- ❌ `@@@` → all chars stripped, becomes empty → button disabled

### Email (S20)
| Rule | Value |
|------|-------|
| Pattern | `local@domain.tld` (RFC-ish: no spaces, exactly one `@`, TLD ≥ 2 chars) |
| Max length | 120 characters |
| Sanitization | Spaces stripped on type |
| Error message | "Please enter a valid email address." |

**Test cases**
- ✅ `jane@example.com`, `user+tag@sub.example.co`
- ❌ `jane@`, `jane@.com`, `jane @example.com` (space stripped → still missing TLD)
- ❌ string ≥ 121 chars (clamped at 120)

### Password (S20, login pages, doctor / admin login)
| Rule | Value |
|------|-------|
| Min length | 8 characters (sign-up only) |
| Max length | **64 characters** (enforced by `PasswordField` itself — applies to onboarding sign-up AND every login form, patient/doctor/admin/per-portal) |
| Required | at least 1 letter AND at least 1 digit (sign-up only) |
| Allowed | any characters (letters, digits, symbols) |
| Error messages | "Use at least 8 characters." / "Include at least one letter." / "Include at least one number." |
| Paste protection | `maxLength=64` on the `<input>` truncates pasted content at the browser level |

### Phone (S21, doctor-onboard)
| Rule | Value |
|------|-------|
| Allowed characters | digits 0–9 only (sanitized on type) |
| Min digits | 10 |
| Max digits | 12 |
| Error message | "Please enter a valid phone number (10–12 digits)." |

**Test cases**
- ✅ `5551234567`, `15551234567`
- ❌ `(555) 123-4567` typed → all non-digits stripped → becomes `5551234567` (valid)
- ❌ `555` → too short, button disabled
- ❌ 13-digit input → 13th digit cannot be typed

### Date of birth (S21)
| Rule | Value |
|------|-------|
| Input type | `<input type="date">` (browser native picker) |
| Max date | today minus `MIN_AGE_YEARS` (18) → user must be ≥ 18 |
| Error message | "You must be at least 18 years old." |

### ZIP code (S21)
| Rule | Value |
|------|-------|
| Allowed characters | digits 0–9 only (sanitized on type) |
| Required format | USPS — 5 digits (`12345`) OR ZIP+4 (`12345-6789`) |
| Hyphen | Inserted automatically after the 5th digit; user does not type it |
| Max length | 10 chars (`12345-6789`) |
| Error message | "Enter a valid US ZIP code (5 digits or 5+4, e.g. 90210 or 90210-1234)." |

**Test cases**
- ✅ `10001`, `90210`, `90210-1234`, `12345-6789`
- ❌ `1234` (too short) → button disabled
- ❌ `abcde` → letters stripped on type
- ❌ `123456789` (no hyphen, user pasted) → auto-formatted to `12345-6789`

### State (S21)
| Rule | Value |
|------|-------|
| Input type | `<select>` dropdown |
| Allowed values | 50 US states + DC + Puerto Rico (USPS 2-letter codes only) |
| Required | yes — Continue disabled until a state is picked |
| Coupling with ZIP | **None.** State is now an independent dropdown (previously inferred from ZIP via a lookup library). The doctor list filter uses this field directly. |
| Source | Canonical list at `apps/web-app/data/usStates.js` — shared with the doctor licensure picker |
| Error message | "Please select your state." |

### Address (S21)
| Rule | Value |
|------|-------|
| Allowed characters | A–Z, a–z, 0–9, space, `,`, `.`, `-`, `#`, `/`, `'` |
| Min length | 5 characters |
| Max length | 150 characters |
| Other | First char must be alphanumeric, last char must be alphanumeric or `.` |
| Error message | "Please enter your street address." |

**Test cases**
- ✅ `123 Main St`, `4B Pine Ave., Apt #2`, `O'Brien Rd`
- ❌ `<script>` → angle brackets stripped on type
- ❌ `abc` → too short

---

## 2. Eligibility / BMI (S3)

Strict integer-only inputs with browser-blocked `.`, `-`, `e`, `+`.

| Field | Min | Max | Maxlength | Error |
|-------|-----|-----|-----------|-------|
| Height (ft) | 2 | 9 | 1 char | "Height must be at least 2 ft." |
| Height (in) | 0 | 11 | 2 chars | "Inches must be between 0 and 11." |
| Height (cm) | 61 | 274 | 3 chars | "Height must be at least 61 cm (2 ft)." |
| Weight (lbs) | 1 | 1100 | 4 chars | "Weight must be 1100 lbs or less." |
| Weight (kg) | 1 | 500 | 3 chars | "Weight must be 500 kg or less." |

**Continue button** is disabled until BMI calculates without error.  
**Special branch:** BMI < 27 routes to the `dHard` end state.

**Test cases**
- ✅ 5 ft 9 in, 180 lbs → BMI 26.6 → routes to dHard
- ✅ 5 ft 9 in, 220 lbs → BMI 32.5 → routes to iGood
- ❌ Typing `5.5` in feet → the dot is stripped; field shows `55`, clamped to `9`
- ❌ Typing `-50` lbs → minus stripped, becomes `50`

---

## 3. Weight history (S4)

| Field | Required | Min | Max | Maxlength |
|-------|----------|-----|-----|-----------|
| `wtHigh` (highest adult weight, lbs) | yes | 50 | 1100 | 4 chars |
| `wtLow` (lowest weight past 5 yrs, lbs) | no | 50 | 1100 | 4 chars |
| `wtGoal` (goal weight, lbs) | yes | 50 | 1100 | 4 chars |
| `waist` (inches) | no | 10 | 100 | 3 chars |

All four are digit-only at the keystroke level. Inline range errors appear if a value is < min or > max. Continue is disabled unless `wtHigh`, `wtGoal` are valid, `wtLow` is empty or valid, and `waist` is empty or valid.

**Test cases**
- ✅ `wtHigh = 250`, `wtGoal = 180`, `wtLow = empty`, `waist = empty` → continues
- ❌ `wtGoal = 5` → "Weight must be at least 50 lbs." appears, button disabled
- ❌ `wtGoal = 1500` → input clamps to `1100`

---

## 4. Single/multi choice screens

| Screen | Field | Rule |
|--------|-------|------|
| S1 | `s1` | One option selected |
| S2 | `s2` | ≥ 1 motivator selected |
| S5 | `s5` | One option selected |
| S6 | `s6` | ≥ 1 past method selected |
| S7 | `s7` | One option selected |
| S7m | `glpMed` | One medication selected |
| S7b | `glpDose` | One dose selected |
| S7a | `glpExperience` | One option |
| S7c | `glpLastInjection` | Date ≤ today |
| S9 | `s9` | ≥ 1 selected |
| S9b | `bariDate` | Date provided |
| S10 | `s10` | ≥ 1 selected |
| S11 | `s11` | ≥ 1 selected; "Other" requires `s11Other` text |
| S12 | `s12` | ≥ 1 selected |
| S13 | `s13` | One option |
| S14 | `s14` + `pregnancyConsent` | Required if pregnant branch |
| S15 | `s15` | One option |
| S16 | `s16` | One option |
| S17 | `s17` | ≥ 1 selected; "Other" requires `s17Other` text |
| S19 | `s19` | ≥ 1 ethnicity selected |

---

## 5. Lifestyle (S18) — all 6 selects required

| Field | Required |
|-------|----------|
| `meals` (meals per day) | yes |
| `exercise` (days/week) | yes |
| `sleep` (hours/night) | yes |
| `fastFood` (per week) | yes |
| `sugary` (drinks per week) | yes |
| `water` (intake) | yes |
| `stress` | always defaults to 5 (1–10 slider) |

Continue disabled until all six selects have a value.

---

## 6. Medications, allergies, pharmacy (S22)

| Field | Required | Max length | Sanitization |
|-------|----------|------------|--------------|
| `meds` | yes (can type "None") | 500 chars | Whitespace collapsed |
| `allergies` | yes (can type "None") | 500 chars | Whitespace collapsed |
| `pharmacy` | no | 200 chars | Whitespace collapsed |

**Free-text fields with caps**
| Field | Max length |
|-------|------------|
| `glpDoseDetails` (S7b) | 500 chars |
| `s11Other` | 200 chars |
| `s17Other` | 200 chars |

---

## 7. Identity upload (S7e)

| Rule | Value |
|------|-------|
| Required | yes (`photoIdName` must be set) |
| Accepted formats | image only (`image/jpeg`, `image/png`, `image/webp`, `image/heic`) |
| Validation | via `validateImageUpload` — size & type checked |
| Error message | Inline under upload buttons |

S7d (vial photo) is **optional** by design — Continue does not require it.

---

## 8. Doctor picker (S22b)

| Rule | Value |
|------|-------|
| Required | `doctorUid` must be set |
| Primary filter | Doctors licensed in `form.state` (the explicit state dropdown on S21) |
| Fallback | If **no** doctor is licensed in the patient's state, the API returns the top doctors from the same portal regardless of state. The UI shows an inline notice: *"No clinicians are licensed in {STATE} yet, so we're showing you our top-rated physicians from nearby."* |
| Ordering | `priority` 1 first, then 2, 3, …; unranked sorts last; ties broken alphabetically; capped at 3 |
| Empty state | "Select your state on the profile screen…" when `form.state` is blank; portal-empty fallback otherwise |
| API response | `{ doctors, fallback: true \| false, patientState }` from `GET /api/doctors/list?state=XX` |

### Priority input (admin → doctors table)
| Rule | Value |
|------|-------|
| Input type | `<input type="text" inputMode="numeric">` |
| Allowed characters | digits `0–9` only — `e`, `+`, `-`, `.`, letters, and symbols are blocked at keystroke (`onBeforeInput`) and at paste (`onPaste`) |
| Min value | 1 (zero rolls back to previous stored priority on blur) |
| Max digits | 4 |
| Leading zeros | stripped automatically (`01` → `1`) |
| Error message | "Priority must be a whole number of 1 or higher." |

---

## 9. Slot booking (S23)

| Rule | Value |
|------|-------|
| Required | `form.slot` must be set (one open slot picked) |
| Booked slots | Visible but disabled with "Already booked" sub-label |
| Auto-refresh | Slots re-fetched every 30s and when the tab regains focus |
| Pre-confirm check | On clicking Confirm, slots are re-fetched and the selection is verified; if taken, selection clears and an error appears |
| Past times | Filtered out server-side |
| **Timezone display** | Slots are sent by the API in the doctor's wall time, then converted to the patient's local timezone on the client (`Intl.DateTimeFormat`). The button face shows the patient's local time; hovering shows the doctor's local time when they differ. |
| **TZ banner** | Visible whenever doctor and patient timezones don't match: *"Times shown in your local timezone (EDT). Your physician is in PDT."* |
| **Confirmation card** | Shows both: patient's local time as the headline, and *"Doctor's local time: 11:00 AM EDT"* underneath when they differ. |
| **Storage** | Appointment is stored in the doctor's wall time + `doctorTimezone` field, so it never drifts even if the patient travels. |

---

## 10. Plan + payment (SPlan, SPay)

| Field | Rule |
|-------|------|
| `plan` (SPlan) | Required — user must explicitly pick `1m`, `3m`, or `6m` (no default) |
| Stripe cardholder | ≥ 2 chars |
| Stripe ZIP (inside Stripe widget) | ≥ 3 chars |
| Server check | After payment, slot is re-verified atomically (`appointmentSlotLocks`); on 409 the user is sent back to S23 |

---

## 11. Consent

| Field | Required | Screen |
|-------|----------|--------|
| `consentH` (HIPAA) | yes | S20 |
| `consentT` (Telehealth) | no | S20 |
| `pregnancyConsent` | yes (only if pregnancy branch) | S14 |

---

## 12. Server-side validation (cannot be bypassed by editing HTML)

### `POST /api/appointments/book`
- `doctorUid`, `date`, `time` required → `400`
- Doctor must exist → `404`
- Slot must still be free; transactional lock via `appointmentSlotLocks` → `409` if taken
- Returns `{ success: true, appointment }` on success

### `GET /api/doctors/list?state=XX`
- `state` parameter must be a 2-letter US state code (`?zip=…` is no longer accepted — see Decoupling note below)
- Result is org-scoped to the patient's portal via auth token
- Capped at top 3 doctors, ordered by `priority` (1 first)
- Returns `{ doctors, fallback, patientState }`; `fallback === true` means no doctor matched the requested state and the response is the top-priority cross-state doctors instead

**Decoupling note:** Previously the API accepted `?zip=` and derived the state via the `zip-state` library. That coupling has been removed — the state is now sourced from the patient's explicit dropdown selection on S21, which is more accurate (ZIP-to-state is wrong near borders) and matches how clinician licensure actually works.

### `GET /api/doctor/patients` and `GET /api/doctor/patients/[uid]`
- Doctors only see patients where `onboarding.doctorUid === their uid` **AND** `onboarding.paid === true`
- Unpaid patient detail returns `404`

### `POST /api/onboarding/save-progress`
- Auth-required; payload is whitelisted to known fields

---

## Quick keyboard test checklist

Paste this into each numeric field and confirm only digits remain:

```
abc123.45,67-89+e10
```

| Field | Expected result |
|-------|-----------------|
| Phone | `1234567891` (10 digits, capped) |
| ZIP | `12345-6789` (9 digits, hyphen auto-inserted) |
| Weight (lbs) | `1100` (capped to max) |
| Height (cm) | `123` |
| Waist (in) | `100` (capped to max) |

Paste into each text field and confirm only safe chars remain:

```
John<script>alert("x")</script>123 Main St., Apt #4
```

| Field | Expected result |
|-------|-----------------|
| First name | `Johnscriptalertxscript Main St Apt` (digits & angle brackets stripped; safe punctuation kept; over 50 chars truncated) |
| Address | `Johnscriptalertx"x"script123 Main St., Apt #4` (angle brackets and `<>` stripped, rest kept up to 150 chars) |
| Allergies / Meds | The full string (free text; only whitespace runs collapsed) |

---

## Constants reference

```
NAME_LIMIT       = 50
ADDRESS_LIMIT    = 150
EMAIL_LIMIT      = 120
NOTES_LIMIT      = 500  (meds, allergies, glpDoseDetails)
PHARMACY_LIMIT   = 200
MIN_AGE_YEARS    = 18

HEIGHT_FT_MIN/MAX  = 2 / 9
HEIGHT_IN_MIN/MAX  = 0 / 11
HEIGHT_CM_MIN/MAX  = 61 / 274
WEIGHT_LBS_MIN/MAX = 50 / 1100
WEIGHT_KG_MIN/MAX  = 20 / 500
WAIST_IN_MIN/MAX   = 10 / 100
```
