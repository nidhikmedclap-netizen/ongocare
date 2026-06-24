# Auth & Dashboard Flow

End-to-end reference for how a user travels from the marketing site → the
weight-loss onboarding form → an authenticated account → the patient
dashboard. Use this as the canonical guide when explaining the system to a
new teammate, writing release notes, or planning the next iteration.

---

## 1. System overview

The app is a Next.js 14 (App Router) site backed by Firebase for identity and
data. There is no separate backend — Firebase services are accessed from two
places:

| Where | What | Lives in |
|---|---|---|
| **Browser (client)** | Read user's own profile, sign in, sign up | Firebase **Web SDK** wrapped in `lib/firebase/*.js` |
| **Next.js API routes (server)** | Write profile data, mint tokens, generate reset links | Firebase **Admin SDK** wrapped in `lib/firebase/admin.js` |

The user never types a password into anything we control — it goes straight
from `<input type="password">` to Firebase Auth over HTTPS. Firebase hashes
it with modulated scrypt and stores only the hash. We never see plaintext
and we never store it in Firestore.

Profile data lives in **Firestore** under `users/{uid}`. The Firebase Auth
UID is the document ID, which is how the two services link.

### Production two-domain split

In production the same Next.js deployment serves two browser URLs:

| URL | Role |
|---|---|
| `web.ongoweightloss.com` | Marketing, static pages, login, signup, onboarding |
| `weightloss.ongocare.com` | Dashboards only (patient / doctor / admin) |

Set in `.env`:

```env
NEXT_PUBLIC_MARKETING_ORIGIN=https://web.ongoweightloss.com
NEXT_PUBLIC_DASHBOARD_ORIGIN=https://weightloss.ongocare.com
```

When both origins are set and differ (`isSplitSiteMode()`):

1. **Middleware** ([middleware.js](../middleware.js)) — on the marketing host,
   any `/dashboard/*` request redirects to the matching login page on the
   marketing host with `?next=<full dashboard URL>`. On the dashboard host,
   non-dashboard routes redirect back to the marketing host.
2. **Login / onboard** — after Firebase sign-in on marketing, `redirectAfterAuth`
   POSTs to `/api/auth/handoff`, mints a custom token, and sends the browser to
   `weightloss.ongocare.com/auth/handoff?token=…&next=…`, which calls
   `signInWithCustomToken` and lands on the dashboard.
3. **Guards** — `useRequireRole` sends signed-out dashboard visitors to
   marketing login (not directly to another dashboard URL).

Org slugs stay path-based (`/medclap1/login`, `/medclap1/dashboard/patient`);
the default `ongo` org uses un-slugged paths.

Leave both origin env vars empty (or equal) for local single-host dev — all
redirects stay same-origin.

```
┌──────────────────────────────┐
│ Firebase Auth (managed)      │  email + hashed password
│   uid = abc123…              │  ←──┐
└──────────────────────────────┘     │ same UID
                                     │
┌──────────────────────────────┐     │
│ Firestore: users/abc123…     │ ←───┘
│   { email, role, firstName,  │     profile + onboarding fields
│     onboarding: {…}, … }     │
└──────────────────────────────┘
```

---

## 2. Component map

```
┌──────────────── PUBLIC SITE ────────────────┐
│  /                       Marketing homepage  │
│  /about, /contact, …     Marketing pages     │
│  /weightloss-onboard     Onboarding form ★   │
│  /login                  Returning users     │
└─────────────────────────────────────────────┘
                    │
                    ▼ (after S20 sign-up / sign-in)
┌──────────────── AUTHENTICATED ──────────────┐
│  /dashboard              Role router         │
│  /dashboard/patient      Patient layout      │
│  ├─ /                    Overview            │
│  ├─ /profile             My details          │
│  ├─ /health              Health profile      │
│  ├─ /appointments        Doctor meet         │
│  └─ /documents           Uploaded files      │
│  /dashboard/doctor       (stub)              │
│  /dashboard/admin        (stub)              │
└─────────────────────────────────────────────┘
```

★ The onboarding form has ~37 screens. Screen **S20** is where email +
password are captured — that's the moment the user transitions from
anonymous to authenticated.

---

## 3. The three core flows

### 3a. Brand-new user — signs up through the onboarding form

```
Browser                       Next.js API                Firebase
   │                              │                          │
   │  S1–S19: filling form (in    │                          │
   │   React state, not saved)    │                          │
   │                              │                          │
   │  S20: types email + pwd      │                          │
   │  + ticks HIPAA consent       │                          │
   │  + clicks Continue           │                          │
   │                              │                          │
   │── signInWithEmailAndPassword(email, pwd) ──────────────▶│
   │                                                         │
   │◀───── auth/invalid-credential (user doesn't exist) ─────│
   │                                                         │
   │── createUserWithEmailAndPassword(email, pwd) ──────────▶│
   │                                                         │
   │◀────────── new uid + ID token ──────────────────────────│
   │                                                         │
   │  signed in, auth.currentUser = {uid, email}             │
   │                                                         │
   │── POST /api/onboarding/save-progress ───▶│              │
   │   Authorization: Bearer <ID token>       │              │
   │   body: { form: {…}, currentStep: "s20" }│              │
   │                                          │              │
   │                                          │── verifyIdToken ─▶│
   │                                          │◀───── uid ──── ───│
   │                                          │                   │
   │                                          │── upsertUser(uid, fields) ───▶│
   │                                          │      Firestore doc users/{uid}│
   │                                          │      role: "patient" (default)│
   │                                          │      status: "incomplete"     │
   │                                          │◀──── set complete ────────────│
   │◀──── 200 { success: true } ──────────────│                   │
   │                                                              │
   │  goTo("s3") — form continues             │                   │
   │                                          │                   │
   │  S3, iGood, iRoad, S4…                   │                   │
   │  ↳ each Next click fires save-progress   │                   │
   │     (via useEffect watching `screen`)    │                   │
   │                                          │                   │
   │  iConfirm — final screen                 │                   │
   │  "Go to your patient portal →"           │                   │
   │  router.push("/dashboard")               │                   │
   │                                                              │
   │── GET /dashboard ────────────────────────────────────────────▶│
   │                                                              │
   │   useAuthUser → onSnapshot users/{uid}                       │
   │   role === "patient" → redirect /dashboard/patient           │
```

**Key code references:**

- Sign-in / sign-up branching: [app/weightloss-onboard/firebaseClient.js — `signInOrSignUp`](../app/weightloss-onboard/firebaseClient.js)
- S20 form handler: [app/weightloss-onboard/WeightlossOnboardForm.jsx — `submitMauticOnEmailCapture`](../app/weightloss-onboard/WeightlossOnboardForm.jsx)
- Email screen UI: [app/weightloss-onboard/_screens/ProfileScreens.jsx — `S20Email`](../app/weightloss-onboard/_screens/ProfileScreens.jsx)
- Save-progress endpoint: [app/api/onboarding/save-progress/route.js](../app/api/onboarding/save-progress/route.js)
- Server upsert helper: [services/firebase/users.js — `upsertUser`](../services/firebase/users.js)
- Auto-save on screen change: `useEffect` in `WeightlossOnboardForm.jsx` keyed on `[screen, authenticatedUid]`
- Final-screen redirect: [app/weightloss-onboard/_screens/EndStateScreens.jsx — `IConfirm`](../app/weightloss-onboard/_screens/EndStateScreens.jsx)

---

### 3b. Returning user — re-enters the form with same credentials

```
Browser                                                Firebase
   │                                                       │
   │  Form re-entered, reaches S20                         │
   │  Types email + password (same as before)              │
   │                                                       │
   │── signInWithEmailAndPassword(email, pwd) ────────────▶│
   │                                                       │
   │◀───── success: same uid as before ───────────────────│
   │                                                       │
   │── POST save-progress (latest form state) ─▶ …         │
   │                                                       │
   │   upsertUser sees the existing users/{uid}            │
   │   doc and runs ref.update() — merges new              │
   │   fields, preserves createdAt, refreshes              │
   │   updatedAt. Returns { created: false }.              │
   │                                                       │
   │   The same UID = same document = same identity.       │
```

**Wrong password branch** (`auth/email-already-in-use` on the create attempt):

```
   │── signInWithEmailAndPassword ───────▶│ fail (wrong pwd)
   │── createUserWithEmailAndPassword ───▶│ fail (email taken)
   │                                                       │
   │  UI surfaces:                                         │
   │  "An account with this email already exists."         │
   │  + clickable "Send reset email"                       │
   │                                                       │
   │── sendPasswordResetEmail(email) ────▶│
   │                                       │ Firebase emails the user a one-time
   │                                       │  reset link from its built-in template
   │  ←── done, banner: "Reset email sent."
```

---

### 3c. Returning user — uses `/login` after completing onboarding

```
Browser                                                 Firebase
   │                                                       │
   │── GET /login ?next=/dashboard ────────────────────────│
   │                                                       │
   │  Renders email + password form                        │
   │  Already-signed-in users are bounced via useEffect.   │
   │                                                       │
   │  Types creds → Submit                                 │
   │                                                       │
   │── signInWithEmailAndPassword(email, pwd) ────────────▶│
   │◀──── success ────────────────────────────────────────│
   │                                                       │
   │  router.replace(next || "/dashboard")                 │
   │                                                       │
   │── GET /dashboard ────────────────────────────────────▶│
   │                                                       │
   │   useAuthUser → role === "patient"                    │
   │   → redirect /dashboard/patient                       │
```

The `?next=` param is how role guards (`useRequireRole`) deep-link a user
back to where they originally tried to go before being bounced to `/login`.

---

## 4. Where data is stored

| Data | Service | Path | Who can read | Who can write |
|---|---|---|---|---|
| Email + password hash | Firebase Auth | (managed) | only Auth itself | only Auth itself |
| Profile + onboarding | Firestore | `users/{uid}` | Owner only (via Web SDK) | Server only (via Admin SDK) |
| Marketing-form capture | Mautic | `mautic.taskor.io` | Mautic admins | Posted by `/api/mautic` |
| Stripe payment intent | Stripe | (managed) | Stripe | `/api/stripe/payment-intent` |

### Firestore document shape

```jsonc
// users/{uid}
{
  "email": "user@example.com",
  "role": "patient",                 // "patient" | "doctor" | "admin"
  "status": "incomplete",            // "incomplete" | "onboarded"
  "currentStep": "s7e",              // last screen reached
  "firstName": "Harish",             // top-level for queries
  "lastName": "Kumar",
  "phone": "9999999999",
  "dob": "1995-04-29",
  "consentHIPAA": true,
  "consentTelehealth": false,
  "onboarding": {                    // raw form snapshot (~45 fields)
    "bmiUnit": "imperial",
    "heightFt": "5",
    "weightLbs": "210",
    "wtGoal": "180",
    "s1": "50+ lbs.",
    "s2": ["I want more energy", "…"],
    "s10": ["High cholesterol", "…"],
    "plan": "3m",
    "paid": true,
    "slot": "Mon May 20|9:00 AM",
    "doctor": "Dr. Vanessa Niles",
    "photoIdName": "id-photo.webp",
    "vialPhotoName": "vial.webp",
    "…": "all other form fields"
  },
  "createdAt": "2026-05-18T19:41:05Z",
  "updatedAt": "2026-05-18T19:54:35Z"
}
```

**Password is never stored here.** Three independent layers strip it:

1. Client — `saveOnboardingProgress` destructures `password` out before `fetch`
2. Server — `/api/onboarding/save-progress` runs every field through `projectFormToUserFields`
3. Service — `BLOCKLISTED_FIELDS = new Set(["password", "passwordConfirm"])` skips them inside `upsertUser`

---

## 5. The dashboard — how role routing works

Anyone visiting `/dashboard` lands on the **role router** ([app/dashboard/page.jsx](../app/dashboard/page.jsx)). It reads the signed-in user's `role` field from their Firestore doc and redirects to the matching sub-route:

```
                /dashboard
                    │
       ┌────────────┼────────────┐
       │            │            │
   patient       doctor        admin           (not signed in)
       │            │            │                  │
       ▼            ▼            ▼                  ▼
/dashboard/    /dashboard/   /dashboard/      /login?next=
   patient        doctor        admin          /dashboard
```

Each sub-route is **also** guarded by `useRequireRole(role)`:

| Page | Hook call | Effect |
|---|---|---|
| `/dashboard/patient/*` | `useRequireRole("patient")` | Doctor or admin gets redirected to their own dashboard |
| `/dashboard/doctor` | `useRequireRole("doctor")` | Patient or admin gets redirected to their own dashboard |
| `/dashboard/admin` | `useRequireRole("admin")` | Patient or doctor gets redirected to their own dashboard |

This is **defense in depth** — even if someone hand-types `/dashboard/admin` in the URL, they get bounced. Firestore Security Rules still block them from reading anyone else's data either way.

**Role assignment** today is manual:

1. Default: every new user gets `role: "patient"` automatically when `upsertUser` creates their doc (see [services/firebase/users.js](../services/firebase/users.js))
2. To promote: open the Firebase Console → Firestore → `users/{uid}` → edit the `role` field → set to `"doctor"` or `"admin"` → save
3. The dashboard updates within ~1 second because `useAuthUser` subscribes via `onSnapshot`

Future iteration: build an admin panel that promotes users via an Admin-SDK call instead of manual console edits, and mirror the role into Firebase Auth Custom Claims for tighter security rules.

---

## 6. The patient dashboard layout

`/dashboard/patient/*` shares a single layout ([layout.jsx](../app/dashboard/patient/layout.jsx)) that:

- Runs `useRequireRole("patient")` once for all sub-pages
- Renders the sidebar + main content area
- On mobile (≤1024px), the sidebar collapses behind a hamburger button and opens as a slide-in drawer

```
Desktop (≥1024px)               Mobile (<1024px)
┌──────┬──────────────┐         ┌──────────────────────┐
│      │              │         │ ☰  Overview     [O]  │  ← topbar
│ side │   page       │         ├──────────────────────┤
│ bar  │   content    │         │                      │
│      │              │         │   page content       │
│      │              │         │                      │
│      │              │         │                      │
└──────┴──────────────┘         └──────────────────────┘
                                  
                                  Tap ☰ → drawer slides in
                                  ┌────────┐
                                  │ side   │ ← X close btn
                                  │ bar    │
                                  │ (≈86vw)│
                                  └────────┘
```

**Sub-routes:**

| Path | Reads from | Purpose |
|---|---|---|
| `/dashboard/patient` | `profile` + computed | Overview hero, stat tiles, BMI gauge, progress bar, next appointment summary |
| `/profile` | `profile` top-level + `onboarding.s19`, `onboarding.address`, etc. | Personal/contact/ethnicity/consents (view-only) |
| `/health` | `onboarding.*` clinical answers | BMI, weight history, GLP-1 history, conditions, lifestyle |
| `/appointments` | `onboarding.slot`, `onboarding.doctor` | Upcoming + past consultations |
| `/documents` | `onboarding.photoIdName`, `onboarding.vialPhotoName` | Uploaded files (currently filenames only — Cloudinary/Storage integration deferred) |

---

## 7. Security model

### Firestore rules ([firestore.rules](../firestore.rules))

```javascript
match /users/{userId} {
  allow read:  if request.auth != null && request.auth.uid == userId;
  allow write: if false;          // server-only via Admin SDK
}
match /{document=**} { allow read, write: if false; }
```

- A signed-in user can read **only their own** `users/{uid}` doc
- Nobody can write from the client — every mutation goes through our API route, which uses the Admin SDK (Admin SDK bypasses rules entirely)
- Everything else is denied by default

**These rules must be published in the Firebase Console** for them to take effect — they do NOT deploy via `git push`. See `firestore.rules` for the canonical content; paste it into Firebase Console → Firestore Database → Rules → Publish.

### Defense in depth

| Layer | What it enforces |
|---|---|
| Firebase Auth | Email/password is real; ID tokens are signed & expire in 1 hour |
| Next.js API route | `verifyIdToken` on every save-progress request — rejects forged/expired tokens with 401 |
| Service helper | `BLOCKLISTED_FIELDS` blocks `password` from ever being written |
| Firestore Rules | Client can only read its own doc; no client writes |
| Role guards (`useRequireRole`) | Wrong-role users are redirected away from sub-routes |

### What's intentionally NOT in scope yet

- **Email verification** — `emailVerified` field exists but we don't enforce it. To require verified email before booking a consultation, add a check in the relevant API routes.
- **Rate limiting on `/api/onboarding/save-progress`** — relies on Firebase Auth's built-in token-issuance rate limits today. Add IP- or UID-keyed rate limiting before going to production.
- **hCaptcha** — deferred. Add to S20 + verify token in `/api/onboarding/save-progress` to prevent bot signup.
- **Auth audit log** — no record of sign-in attempts / failed logins yet. Firebase Auth Console shows recent activity; for compliance-grade audit, set up Cloud Logging exports.
- **Session management** — Firebase Auth uses long-lived refresh tokens by default (no manual session expiry). Set token persistence to `inMemory` in `lib/firebase/auth.js` if shared computers are a concern.

---

## 8. Environment variables

| Var | Where | Purpose |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Browser | Web SDK config (public — security comes from rules, not hiding this) |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Browser | `{project-id}.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Browser | Project identifier |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Browser | For future Cloud Storage uploads |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Browser | FCM sender id |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Browser | App-level identifier |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Browser | Analytics (optional) |
| `FIREBASE_ADMIN_PROJECT_ID` | **Server only** | Same project ID, repeated for Admin SDK init |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | **Server only** | Service-account email |
| `FIREBASE_ADMIN_PRIVATE_KEY` | **Server only** | Service-account private key — **this is the real secret** |

Server-only vars (no `NEXT_PUBLIC_` prefix) are never bundled to the browser by Next.js. They are read by `lib/firebase/admin.js` on first use.

**`.env.example`** in the repo is the safe template to copy. Never commit a populated `.env`.

---

## 9. Quick reference — file responsibilities

```
lib/firebase/
├── config.js          Reads env vars, validates required fields
├── client.js          Web SDK app singleton (HMR-safe via getApps() guard)
├── auth.js            Web SDK auth instance
├── firestore.js       Web SDK Firestore instance
├── storage.js         Web SDK Storage instance (unused until file uploads ship)
├── analytics.js       Browser-only, prod-only Analytics
├── index.js           Barrel for ergonomic imports
└── admin.js           ★ Admin SDK singleton — SERVER ONLY ★

lib/auth/
├── useAuthUser.js     React hook: { user, profile, role, loading }
└── useRequireRole.js  Per-page role guard with redirect logic

services/firebase/
└── users.js           upsertUser + projectFormToUserFields (server-side helpers)

services/mautic/
└── transactional.js   Stub for "welcome email" — replace when Mautic is wired

app/api/onboarding/
└── save-progress/
    └── route.js       Verifies ID token → upserts users/{uid}

app/weightloss-onboard/
├── firebaseClient.js  Client helpers: signInOrSignUp, saveOnboardingProgress, sendResetEmail
├── WeightlossOnboardForm.jsx  Form state + handlers + auto-save effect
├── schema.js          initialForm + zod schema (form data shape)
├── utils.js           Validators (isValidEmail, isValidPassword, BMI math, etc.)
└── _screens/
    ├── ProfileScreens.jsx     S20 email/password screen UI
    └── EndStateScreens.jsx    iConfirm → /dashboard redirect

app/login/page.jsx     Sign-in form + forgot-password flow

app/dashboard/
├── page.jsx                  Role router
├── doctor/page.jsx           Stub (role-gated)
├── admin/page.jsx            Stub (role-gated)
└── patient/
    ├── layout.jsx            Sidebar + role guard
    ├── PatientSidebar.jsx    Nav + mobile drawer
    ├── dashboard.module.css  All styles (uses globals.css tokens)
    ├── page.jsx              Overview
    ├── profile/page.jsx      My details
    ├── health/page.jsx       Health profile
    ├── appointments/page.jsx Doctor meet
    └── documents/page.jsx    Uploaded files

firestore.rules        Security rules — paste into Firebase Console to deploy
.env.example           Committed env template (no values)
.env                   Local secrets (gitignored)
```

---

## 10. Setup checklist for a new environment

1. Create a Firebase project (or use existing)
2. **Authentication** → enable **Email/Password** sign-in method
3. **Firestore Database** → Create database → **Production mode** → region `nam5`
4. **Project Settings** → **Service accounts** → Generate new private key → save the JSON locally (never commit)
5. Copy `.env.example` → `.env`, fill in:
   - 7 × `NEXT_PUBLIC_FIREBASE_*` from Project Settings → Your apps → Web app config
   - 3 × `FIREBASE_ADMIN_*` from the service-account JSON
6. **Firestore Database** → Rules → paste contents of [firestore.rules](../firestore.rules) → Publish
7. **Authentication** → Settings → Authorized domains → add both production
   hostnames (`web.ongoweightloss.com`, `weightloss.ongocare.com`) plus
   `localhost` for local dev
8. `npm install && npm run dev` → http://localhost:3000

For Vercel / production: add the same env vars in the host's environment settings. The service-account private key MUST keep its `\n` escapes intact — wrap the value in double quotes. Attach **both** custom domains to the same Vercel project; DNS CNAME records point each hostname at Vercel.

---

## 11. Known limitations & future work

- **Image uploads deferred** — currently only filenames are stored on `vialPhotoName` / `photoIdName`. Next iteration: enable Firebase Storage (requires Blaze plan) or wire Cloudinary with signed URLs.
- **Mautic welcome email** — currently stubbed (logs the password-reset link to server console). Real send happens when the user fills in the Mautic API details and the stub is replaced in [services/mautic/transactional.js](../services/mautic/transactional.js).
- **Editable profile** — the patient dashboard is view-only. Edits today require going back through the onboarding form. Add an inline edit affordance + new API route when ready.
- **Resume from `currentStep`** — `currentStep` is captured but the form always starts at S1 on reload. To honor it, hydrate the form's `screen` state from Firestore on mount when the user is already signed in.
- **Doctor / admin dashboards** — stubs only. Each role's actual workspace is its own design + implementation pass.
- **Form data lost on tab close mid-screen** — saves fire on screen transition, not on input change. Add a debounced auto-save or `beforeunload` flush if drop-off analytics matter.

---

_Last updated: 2026-05-19_
 