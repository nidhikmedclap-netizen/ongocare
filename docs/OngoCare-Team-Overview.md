# OngoCare Team Overview
## Onboarding Forms, Validation & Dashboards

**Document date:** June 6, 2026  
**Purpose:** Shareable reference for the product and engineering team.

---

## Table of Contents

1. [Weight Loss Patient Onboard Form](#1-weight-loss-patient-onboard-form)
2. [After Login — Patient Side](#2-after-login--patient-side)
3. [Doctor Onboard Form](#3-doctor-onboard-form)
4. [Doctor Dashboard](#4-doctor-dashboard)
5. [How Appointments Work](#5-how-appointments-work-end-to-end)
6. [Patient vs Doctor Comparison](#6-quick-comparison--patient-vs-doctor)
7. [Admin Roles](#7-admin-brief-for-context)
8. [Known Gaps](#8-known-gaps)

---

## 1. Weight Loss Patient Onboard Form

**Route:** `/weightloss-onboard` (also available per organization at `/[organization]/weightloss-onboard`)

**What it is:** A multi-step questionnaire (~40 screens). Progress auto-saves after login. Users can leave and resume later from the dashboard.

### Recent Additions / Improvements

- **Account + profile moved earlier** — email/password and personal details collected before BMI questions
- **11-digit US phone format** — stored as `1` + 10 digits, displayed as `+1 (888) 655-5267`
- **Resume onboarding** — incomplete users see "Resume onboarding" on the dashboard
- **State-based doctor matching** — doctors filtered by patient's licensed state (not ZIP)
- **Real appointment slots** — live doctor availability with timezone display
- **Stripe payment** — manual capture (authorized vs captured shown on dashboard)
- **Coupon codes** — optional discount at payment
- **Atomic slot booking** — prevents double-booking
- **Multi-tenant support** — org-specific branding

### Form Flow (High Level)

```
Welcome → Account (email/password) → Profile → BMI check
→ Weight history → Medications → Photo ID → Surgery history
→ Medical history → Safety questions → Lifestyle
→ Ethnicity → Meds/allergies → Pick doctor → Book slot
→ Choose plan → Pay → Confirmation
```

**Disqualification screens** (user cannot continue the program):

- BMI below 27
- MTC/MEN2 family history = Yes
- Pancreatitis history = Yes

### Validation by Section

| Section | Fields | Validation Rules |
|---------|--------|------------------|
| **Welcome (S1–S2)** | Weight goal | Must select one option |
| | Motivations | At least 1 selected |
| **Account (S20)** | Email | Valid format, max 120 chars |
| | Password | Min 8 chars, at least 1 letter + 1 number |
| | HIPAA consent | **Required** checkbox |
| | Telehealth consent | Optional |
| **Profile (S21)** | First / Last name | 2–50 chars, letters only |
| | Date of birth | Required, must be **18+** |
| | ZIP | US format: `12345` or `12345-6789` |
| | State | Required dropdown (used for doctor matching) |
| | Phone | **Exactly 11 digits** (`1` + 10-digit US number) |
| | Address | 5–150 chars |
| **BMI (S3)** | Height / Weight | Imperial or metric; weight 50–1100 lbs |
| | BMI result | Must be **≥ 27** to continue |
| **Weight history (S4–S6)** | Highest / goal weight | 50–1100 lbs |
| | Lowest weight, waist | Optional |
| | Struggle duration | Required |
| | Past methods tried | At least 1 selected |
| **GLP-1 meds (S7)** | Currently on GLP-1? | Yes → extra screens; No → skip to photo ID |
| | Medication, dose, last injection | Required if on GLP-1 |
| | Vial photo | Optional; JPG/PNG/HEIC/WEBP, max 10 MB |
| **Photo ID (S7e)** | Government ID photo | **Required**; same file rules as above |
| **Surgery (S9)** | Bariatric procedures | At least 1; "None of these" is exclusive |
| | Surgery date | Required if surgery selected |
| **Medical (S10–S11)** | Diagnoses, conditions | At least 1 each; "None" is exclusive |
| **Safety (S12–S15)** | Safety checklist | At least 1; "None" is exclusive |
| | MTC/MEN2 | Yes → disqualified |
| | Sex at birth | Male skips pregnancy questions |
| | Pregnancy | Yes → consent checkbox required |
| | Pancreatitis | Yes → disqualified |
| **Lifestyle (S16–S18)** | Alcohol, drugs, meals, exercise, sleep, etc. | All required |
| | "Other" drug use | Free text required if "Other" selected |
| | Stress level | Slider 1–10 |
| **Wrap-up (S19, S22)** | Ethnicity | At least 1; "Prefer not to say" is exclusive |
| | Current meds, allergies | Required (can type "None"), max 500 chars |
| | Pharmacy | Optional |
| **Doctor (S22b)** | Select doctor | Required; filtered by patient's state |
| **Booking (S23)** | Time slot | Required; real-time availability check |
| **Plan (SPlan)** | 1m / 3m / 6m plan | Must select one ($69 / $219 / $499) |
| **Payment (SPay)** | Card, name, ZIP | Valid card via Stripe; coupon optional |

---

## 2. After Login — Patient Side

### Login Flow

1. Patient signs in at `/login` with email + password (created at S20)
2. Redirected to `/dashboard/patient`
3. If onboarding incomplete → dashboard shows **"Resume onboarding"** link
4. If already onboarded → full dashboard access
5. Email verification banner shown (non-blocking — can still use dashboard)

### What Patient Can Do (CRUD)

| Data | Create | Read | Edit | Delete |
|------|--------|------|------|--------|
| Profile / health info | During onboarding | Yes — dashboard | No — must resume onboarding | No |
| Appointments | During onboarding (after payment) | Yes — dashboard | No | No |
| Plan / payments | During onboarding (Stripe) | Yes — dashboard | No | No |
| Documents (ID, vial photo) | During onboarding | Yes — filenames only | Via onboarding resume | No |

**Important:** The patient dashboard is **view-only**. To change profile or health answers, patients must go back to the onboard form via "Resume onboarding."

### Patient Dashboard Pages

| Page | What Patient Sees |
|------|-------------------|
| **Overview** | Onboarding %, BMI, weight goal, plan status, next appointment, resume CTA |
| **My Details** | Name, DOB, phone, address, ethnicity, consents (read-only) |
| **Health** | Full clinical intake: BMI, weight history, GLP-1, conditions, lifestyle |
| **Appointments** | Upcoming & past visits, doctor name, time (timezone-adjusted), video link |
| | Past completed visits: prescription text if doctor issued one |
| | Cancelled visits: cancellation reason from doctor |
| **Plan & Billing** | Active plan, payment status (authorized/captured), card last 4, payment history |
| **Documents** | Uploaded file names (photo ID, vial photo) |
| **About** | Company info |

**Patient cannot:** cancel, reschedule, or edit appointments from the dashboard.

---

## 3. Doctor Onboard Form

**Route:** `/doctor/doctor-onboard`

**What it is:** A **single-page form** with 9 sections (scroll down). Not a step-by-step wizard.

### Validation by Section

| Section | Fields | Validation Rules |
|---------|--------|------------------|
| **1. Your details** | First / Last name | 2–50 chars, letters only |
| | Phone | 11-digit US format (`+1 (XXX) XXX-XXXX`) |
| **2. Sign-in** | Work email | Valid email format |
| | Password | Min 8 chars, 1 letter + 1 number |
| **3. Profile photo** | Headshot | **Optional**; image only, max 6 MB |
| **4. Bio** | Professional bio | **Min 30 chars**, max 600 |
| **5. Licenses** | State + license number | At least 1 license required |
| | License number | 2–30 chars, alphanumeric + hyphen |
| | License type | MD, DO, NP, PA, RN, PharmD, Other (defaults MD) |
| | Duplicate check | **Unique per state** — same state + number cannot appear twice on form or on another doctor. Same number in different states is allowed |
| **6. Availability** | Slot duration | 15 / 20 / 30 / 45 / 60 minutes |
| | Weekly schedule | At least 1 day enabled with valid start < end time |
| | Default | Mon–Fri 9 AM–5 PM |
| **7. Prescription template** | Rx template | Min 30 chars, max 4000; pre-filled with placeholders |
| **8. E-signature** | Signature pad | **Optional**; draw on canvas |
| **9. Banking** | Account holder name | Valid name format |
| | Bank name | Min 2 chars |
| | Account type | Checking or Savings |
| | Routing number | Exactly 9 digits |
| | Account number | 4–17 digits |
| **Consent** | Terms checkbox | **Required** to submit |

### After Doctor Submits

- Firebase account created with `role: "doctor"`, `status: "pending"`
- Redirected to `/dashboard/doctor`
- Sees **"Verification in progress"** screen until admin approves
- Once approved (`status: "active"`) → full doctor dashboard unlocks

---

## 4. Doctor Dashboard

| Page | What Doctor Can Do |
|------|-------------------|
| **Overview** | Stats: assigned patients, upcoming appointments, pending notes, earnings |
| **Patients** | List of paid patients assigned to this doctor; search; filter by upcoming visit |
| | Click patient → full intake, BMI, billing, prescription panel |
| **Appointments** | View all appointments (Upcoming / Past / All tabs) |
| | **Edit** consultation type (Initial, Ozempic, Wegovy, Zepbound, Follow-up) |
| | **Edit** session notes |
| | **Issue / edit** prescription |
| | **Mark completed** |
| | **Cancel** — must enter cancellation reason (shown to patient) |
| **Transactions** | Commission earnings from patient plan signups |
| **Availability** | Edit weekly hours, slot duration, block specific dates |

**Doctor cannot:** reschedule appointments (change date/time), create new appointments from dashboard, or delete appointment records.

**Doctor only sees patients who:** paid (authorized or captured) AND selected this doctor during onboarding.

---

## 5. How Appointments Work (End-to-End)

### Booking (During Patient Onboarding Only)

```
Patient picks doctor (by state) → picks open slot → pays via Stripe
→ system books appointment atomically → confirmation screen → dashboard
```

- If slot was taken by someone else during payment → patient sent back to slot picker
- Appointment status starts as **scheduled**

### During the Visit

| Action | Who Can Do It | What Happens |
|--------|---------------|--------------|
| **View appointment** | Patient, Doctor, Admin | See date, time, doctor, status |
| **Add session notes** | Doctor | Saved to appointment record |
| **Change visit type** | Doctor | e.g. Initial → Follow-up |
| **Issue prescription** | Doctor | Patient sees it on past appointments page |
| **Mark completed** | Doctor | Status → `completed`; patient sees Rx if issued |
| **Cancel** | Doctor (with reason), Superadmin | Status → `cancelled`; patient sees reason |
| **Reschedule** | Nobody | Not built yet — date/time cannot be changed after booking |
| **Patient self-cancel** | Patient | No cancel button or API for patients |

### Appointment Statuses

| Status | Meaning |
|--------|---------|
| `scheduled` | Booked, upcoming |
| `completed` | Visit done; notes/Rx may be attached |
| `cancelled` | Doctor cancelled with a reason |

---

## 6. Quick Comparison — Patient vs Doctor

| Feature | Patient | Doctor |
|---------|---------|--------|
| View own appointments | Yes | Yes (own patients only) |
| Book new appointment | Yes (onboarding only) | No |
| Cancel appointment | No | Yes (reason required) |
| Reschedule | No | No |
| Edit profile from dashboard | No (resume onboarding) | No |
| View health intake | Yes (own) | Yes (assigned patients) |
| Issue prescription | No | Yes |
| Manage availability | No | Yes |
| View earnings / billing | Yes (own payments) | Yes (commissions) |
| Account approval needed | No | Yes — admin must approve |

---

## 7. Admin (Brief for Context)

| Role | Can Do |
|------|--------|
| **Portal Admin** | View patients, doctors, appointments, transactions (read-only for most) |
| **Superadmin** | Full CRUD: approve doctors, edit/delete patients, cancel/delete appointments, manage coupons |

---

## 8. Known Gaps

1. **No patient self-service for appointments** — cannot cancel or reschedule from dashboard
2. **Reschedule not implemented** for any role
3. **Dashboard is view-only for patients** — edits happen only via resuming onboarding
4. **File uploads** store filename only today — actual file storage is deferred
5. **Google sign-in button** on patient form is visible but not wired yet

---

*Generated from the OngoCare codebase — June 2026*
