# How OngoCare Works Today
### A simple guide for the team — May 2026

---

## The big picture (in one sentence)

**One Next.js app on Vercel talks to one Firebase project — but visitors see two websites: a public marketing site and a private dashboard site.**

---

## Your two live URLs

| Website | Address | What lives here |
|---------|---------|-----------------|
| **Marketing site** | `web.ongoweightloss.com` | Homepage, About, Contact, Login, Sign-up, Onboarding questionnaire |
| **Dashboard site** | `weightloss.ongocare.com` | Patient, Doctor, and Admin portals only |

Both URLs point to the **same Vercel deployment**. The app looks at the domain name and decides what to show.

**Why two domains?**
- Marketing stays clean and public-facing
- Dashboards feel like a separate “app” for logged-in users
- Easier to explain to partners and white-label portals

---

## What runs where

```
┌─────────────────────────────────────────────────────────────┐
│  VERCEL (hosts the Next.js app)                             │
│  • One project: ongocare                                    │
│  • Root folder: apps/web-app                                │
│  • Domains: web.ongoweightloss.com + weightloss.ongocare.com│
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  FIREBASE — project: ongo-prod (Blaze plan)                 │
│  • Authentication — who can log in (email + password)       │
│  • Firestore — profiles, appointments, prescriptions, etc.  │
│  • Admin SDK — server-side writes from API routes           │
└─────────────────────────────────────────────────────────────┘
```

**DNS (SiteGround)** only points your domain names to Vercel. SiteGround does not run the app.

---

## User roles — who sees what

| Role | Who | Dashboard |
|------|-----|-----------|
| **Patient** | Someone who completed (or is doing) onboarding | `/dashboard/patient` |
| **Doctor** | Licensed clinician | `/dashboard/doctor` |
| **Admin** | Portal operator (one white-label brand) | `/dashboard/admin` |
| **Superadmin** | Platform owner (you) — sees **all** portals | `/dashboard/admin` (all data) |

Roles live in **Firestore** (`users/{uid}.role`), not just in Firebase Auth.

**Admins are never created through public signup.** They are seeded with a script (`scripts/seed-admin.mjs`) or Firebase Console.

### Your prod admins today

| Email | Role | Portal |
|-------|------|--------|
| deep@medclap.com | Superadmin | All portals |
| admin@medclap.com | Admin | Ongo (default) |
| admin1@medclap.com | Admin | medclap1 |
| admin2@medclap.com | Admin | medclap2 |
| admin3@medclap.com | Admin | medclap3 |

---

## White-label portals (multi-org)

You can run several branded versions of the same product. Each portal has a **slug** in the URL:

| Portal | Example login | Example dashboard |
|--------|---------------|-------------------|
| Ongo (default) | `/login` | `/dashboard/patient` |
| MedClap 1 | `/medclap1/login` | `/medclap1/dashboard/patient` |
| MedClap 2 | `/medclap2/login` | `/medclap2/dashboard/patient` |
| MedClap 3 | `/medclap3/login` | `/medclap3/dashboard/patient` |

Branding (logo, colors, copy) comes from `data/organizations.js`. Same codebase — different look per slug.

**Rule:** A medclap1 admin must log in at `/medclap1/admin/admin-login`, not another portal’s URL.

---

## Flow 1 — New patient (happy path)

```
1. Visitor lands on web.ongoweightloss.com
         ↓
2. Clicks "Get started" → /weightloss-onboard
         ↓
3. Fills questionnaire (~37 screens)
         ↓
4. Creates account (email + password) → Firebase Auth
         ↓
5. Profile saved → Firestore users/{uid}  (role: patient)
         ↓
6. Books appointment, pays (Stripe), picks doctor, etc.
         ↓
7. Clicks "Go to dashboard"
         ↓
8. AUTH HANDOFF (see below) → weightloss.ongocare.com/dashboard/patient
```

---

## Flow 2 — Returning patient (login)

```
1. web.ongoweightloss.com/login
         ↓
2. Email + password → Firebase Auth
         ↓
3. App reads Firestore profile → knows role = patient
         ↓
4. Auth handoff → weightloss.ongocare.com/dashboard/patient
```

---

## Flow 3 — Auth handoff (why it exists)

Firebase login happens on the **marketing** domain. The **dashboard** is on another domain. Browsers don’t share cookies across domains — so we bridge the session:

```
Marketing site (logged in)
      │
      │  POST /api/auth/handoff  (server verifies ID token)
      │
      ▼
Server mints a short-lived custom token
      │
      ▼
Browser redirects to:
weightloss.ongocare.com/auth/handoff?token=...&next=/dashboard/patient
      │
      ▼
Dashboard site signs in with custom token
      │
      ▼
User lands on their dashboard ✓
```

This is automatic — users don’t see the technical steps.

---

## Flow 4 — Someone tries the dashboard without logging in

```
User opens weightloss.ongocare.com/dashboard/patient
         ↓
Not signed in → redirected to:
web.ongoweightloss.com/login?next=https://weightloss.ongocare.com/dashboard/patient
         ↓
After login → handoff → back to dashboard
```

**Important:** We never send people straight to the dashboard login on the wrong domain. They always log in on the marketing site first.

---

## Flow 5 — Doctor & admin

| Person | Where they log in | Where they land |
|--------|-------------------|-----------------|
| Doctor | `/doctor/doctor-login` (or `/{slug}/doctor/doctor-login`) | `/dashboard/doctor` |
| Admin | `/admin/admin-login` (or `/{slug}/admin/admin-login`) | `/dashboard/admin` |

Same handoff pattern after login in production.

---

## Flow 6 — Doctor writes a prescription

```
Doctor opens appointment on dashboard
         ↓
Optional: "Issue prescription for this visit"
         ↓
Picks medication + strength → live preview
         ↓
Saves → Firestore (appointment record updated)
         ↓
Patient sees prescription on:
  • Past appointments
  • Documents page
```

Prescription catalog: Ozempic, Wegovy, Rybelsus, Mounjaro, Zepbound, Liraglutide (injection + tablet formats).

---

## How data is stored

### Firebase Authentication
- Email + hashed password only
- Each user gets a unique **UID**

### Firestore `users/{uid}`
- Profile: name, phone, role, orgSlug, onboarding answers
- **Password is never stored here**

### Other Firestore collections
- Appointments, doctor availability, coupons, etc.
- **All writes go through Next.js API routes** (Admin SDK)
- Client can only read its own user doc (security rules)

---

## Security & privacy choices you made

| Setting | What it means |
|---------|----------------|
| **noindex sitewide** | Google and other search engines should not list your pages |
| **Firestore production rules** | Clients cannot write data directly — server validates everything |
| **Portal isolation** | medclap1 admin only sees medclap1 data (unless superadmin) |
| **Authorized domains** | Firebase only allows login from your real domains |

---

## Environment variables (the knobs)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_FIREBASE_*` | Browser connects to ongo-prod |
| `FIREBASE_ADMIN_*` | Server + seed scripts |
| `NEXT_PUBLIC_MARKETING_ORIGIN` | `https://web.ongoweightloss.com` |
| `NEXT_PUBLIC_DASHBOARD_ORIGIN` | `https://weightloss.ongocare.com` |
| Stripe keys | Payments (when enabled) |

**Local dev:** Leave marketing/dashboard origins empty → everything runs on `localhost:3000` with no split.

Set in **`.env.local`** (local) and **Vercel → Environment Variables** (production).

---

## Git & deployment

| Branch | Purpose |
|--------|---------|
| `development` | Work in progress |
| `main` | Production — Vercel auto-deploys from here |

**Repo:** github.com/medclap/ongocare  
**App path in repo:** `apps/web-app`

---

## Day-to-day operations cheat sheet

| Task | How |
|------|-----|
| Add a new admin | `node scripts/seed-admin.mjs --email=... --role=admin --org=medclap1 --password=...` |
| Add superadmin | `--role=superadmin` |
| Change Firebase config | Update Vercel env vars → Redeploy |
| New white-label portal | Add org in `data/organizations.js` + seed admin for that slug |
| Check who’s logged in | Firebase Console → Authentication → Users |
| Check user role | Firestore → users → open UID doc |

---

## Simple diagram — full journey

```
                    INTERNET
                       │
         ┌─────────────┴─────────────┐
         ▼                           ▼
 web.ongoweightloss.com      weightloss.ongocare.com
   (Marketing)                    (Dashboards)
         │                           │
    Homepage                    Patient portal
    About                         Doctor portal
    Contact                       Admin portal
    Login ───────── handoff ──────► Auth bridge
    Onboard                           │
         │                           │
         └───────────┬───────────────┘
                     ▼
              VERCEL (Next.js)
                     │
                     ▼
              FIREBASE ongo-prod
              • Auth (login)
              • Firestore (data)
```

---

## Questions people often ask

**Q: Is this two separate apps?**  
A: No — one app, two domain names, smart routing.

**Q: Where do passwords live?**  
A: Firebase Auth only. We never store plaintext passwords.

**Q: Can medclap1 patients see medclap2 data?**  
A: No — APIs filter by `orgSlug`. Superadmin is the exception.

**Q: Why is the site not on Google?**  
A: You enabled noindex on purpose while in launch / private mode.

**Q: Dev vs prod Firebase?**  
A: Production uses **ongo-prod**. Old dev project was **ongo-dev** — keep them separate.

---

*Document generated for OngoCare / MedClap — internal team reference.*
