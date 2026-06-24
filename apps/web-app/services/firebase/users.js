// services/firebase/users.js
//
// Server-side helpers for the `users/{uid}` Firestore collection.
//
// All functions in this file go through the Admin SDK and therefore BYPASS
// Firestore Security Rules — they're meant to be called only from trusted
// server code (API route handlers). Never import this from a client component.
//
// Document shape:
//
//   users/{uid}
//   ├── email             string         — Firebase Auth email (always set)
//   ├── status            "incomplete" | "onboarded"
//   ├── currentStep       string         — last screen ID the user reached
//   ├── firstName         string?        — mirrored from form for queries
//   ├── lastName          string?
//   ├── phone             string?
//   ├── dob               string?        — YYYY-MM-DD
//   ├── consentHIPAA      boolean
//   ├── consentTelehealth boolean
//   ├── onboarding        map            — full snapshot of form state
//   ├── welcomeEmailSentAt timestamp?   — set after welcome email (post email/password signup)
//   ├── welcomeEmailPending boolean?    — email/password signup awaiting profile firstName
//   ├── createdAt         timestamp
//   └── updatedAt         timestamp
//
// IMPORTANT: the password is NEVER stored here. Firebase Authentication
// stores the password (hashed, never plaintext) as a separate service,
// linked to this doc by the UID. We only persist profile data.

import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import {
  cascadePatientName,
  enrichAppointmentRows,
  loadDisplayNamesByUid,
  resolveOnboardingDoctorLabel,
} from "@/services/firebase/nameSync";
import { mergePaymentIntoOnboarding } from "@/lib/billing/patientPayment";
import { getPlanPaymentForPatient } from "@/services/firebase/planPayments";
import {
  formatPhoneDisplay,
  isValidPhone,
  normalizePhoneForStorage,
} from "@/lib/phone/usPhone";
import { doctorBelongsToPortal } from "@/lib/orgs/doctorPortals";

const USERS_COLLECTION = "users";

// Fields we promote from the raw form to top-level for easy querying.
// Anything else lives under `onboarding`. The password field is explicitly
// blocklisted so it never reaches Firestore even if a client accidentally
// includes it in a save-progress request.
const TOP_LEVEL_FIELDS = ["email", "firstName", "lastName", "phone", "dob"];
const BLOCKLISTED_FIELDS = new Set(["password", "passwordConfirm"]);

// Valid role values. Anything else is rejected at create time.
//  - patient    : signed-up consumer scoped to a single portal
//  - doctor     : clinician scoped to a single portal
//  - admin      : ops user scoped to a single portal (sees only that
//                 portal's patients/doctors/appointments)
//  - superadmin : platform-wide operator (sees every portal). Created
//                 out-of-band — never via signup
const VALID_ROLES = new Set(["patient", "doctor", "admin", "superadmin"]);

// Slug used when no portal context is supplied (e.g. signup happened on the
// default Ongo site at "/", not under "/<slug>/"). Re-exported from lib/orgs
// so both server code (here) and "use client" components can reach the same
// value without pulling firebase-admin into the browser bundle.
export { DEFAULT_ORG_SLUG } from "@/lib/orgs";
import { DEFAULT_ORG_SLUG } from "@/lib/orgs";

// Loose validation — slugs come from the URL and must round-trip safely.
// A real path-segment slug: lowercase letters, digits, and hyphens, up to
// 40 chars. Anything that fails this gets coerced to DEFAULT_ORG_SLUG so a
// bad slug can't open up cross-tenant access.
const SLUG_RE = /^[a-z0-9-]{1,40}$/;
export function normalizeOrgSlug(slug) {
  if (typeof slug !== "string") return DEFAULT_ORG_SLUG;
  const trimmed = slug.trim().toLowerCase();
  return SLUG_RE.test(trimmed) ? trimmed : DEFAULT_ORG_SLUG;
}

export function isSuperAdmin(userOrRole) {
  if (!userOrRole) return false;
  const role = typeof userOrRole === "string" ? userOrRole : userOrRole.role;
  return role === "superadmin";
}

/**
 * Create or update users/{uid}. Existing fields not present in `fields`
 * are preserved.
 *
 * `fields` may contain:
 *   - top-level scalars (email, firstName, lastName, …)
 *   - a `formSnapshot` object — merged into the nested `onboarding` field
 *   - any other arbitrary key/value pairs to set at the top level
 *
 * Returns `{ created: boolean }` so callers can react to first-time vs update.
 */

/** Block patient onboarding writes against admin/doctor/superadmin accounts. */
export async function assertPatientOnboardingWritable(uid) {
  const snap = await adminDb.collection(USERS_COLLECTION).doc(uid).get();
  if (!snap.exists) {
    return { exists: false, welcomeEmailSentAt: null, welcomeEmailPending: false };
  }
  const role = snap.data()?.role;
  if (role && role !== "patient") {
    const err = new Error(
      "This account is not a patient account. Sign out and try again.",
    );
    err.code = "ONBOARDING_WRONG_ROLE";
    throw err;
  }
  return {
    exists: true,
    role: role || "patient",
    status: snap.data()?.status || null,
    welcomeEmailSentAt: snap.data()?.welcomeEmailSentAt || null,
    welcomeEmailPending: !!snap.data()?.welcomeEmailPending,
  };
}

export async function upsertUser(uid, fields = {}) {
  const ref = adminDb.collection(USERS_COLLECTION).doc(uid);
  const snap = await ref.get();
  const now = FieldValue.serverTimestamp();

  const { formSnapshot, ...topLevel } = fields;

  // Build the nested onboarding map ONCE — we use it differently below
  // depending on whether the doc exists. Firestore semantics:
  //   - ref.set({ "a.b": val })    → literal top-level key "a.b" (BAD)
  //   - ref.update({ "a.b": val }) → nested path { a: { b: val } }   (GOOD)
  // So for `.set()` we must pass a real nested object; for `.update()` we
  // pass dot-pathed keys so unchanged sub-fields are preserved.
  const onboardingMap = {};
  if (formSnapshot && typeof formSnapshot === "object") {
    for (const [key, value] of Object.entries(formSnapshot)) {
      if (value === undefined) continue;
      if (BLOCKLISTED_FIELDS.has(key)) continue;
      onboardingMap[key] = value;
    }
  }

  if (!snap.exists) {
    // First save for this UID — write a real nested object via .set().
    // role and orgSlug are only honored at creation. Defaults are "patient"
    // and DEFAULT_ORG_SLUG respectively. Subsequent updates never change
    // these; promotions/tenant moves go through dedicated admin tooling.
    // Only patient (onboarding) and doctor (signup route) may be created here.
    // Admin/superadmin accounts are seeded out-of-band — never via upsertUser.
    const requestedRole = topLevel.role;
    const role = requestedRole === "doctor" ? "doctor" : "patient";
    const orgSlug = normalizeOrgSlug(topLevel.orgSlug);
    const { role: _r, orgSlug: _o, orgSlugs: _os, ...rest } = topLevel;
    const createPayload = {
      role,
      orgSlug,
      status: "incomplete",
      createdAt: now,
      updatedAt: now,
      ...rest,
      onboarding: onboardingMap,
    };
    if (role === "doctor") {
      createPayload.orgSlugs = [orgSlug];
    }
    await ref.set(createPayload);
    return { created: true };
  }

  // Existing doc: NEVER let an update flip the role OR orgSlug. Either of
  // these would break tenant isolation, so we strip them defensively even
  // if a caller passed them. Migrations of either field happen through a
  // separate admin tool that goes through Firestore directly.
  if ("role" in topLevel) delete topLevel.role;
  if ("orgSlug" in topLevel) delete topLevel.orgSlug;
  if ("orgSlugs" in topLevel) delete topLevel.orgSlugs;

  // Existing doc — merge top-level fields and individual onboarding sub-fields
  // via dot-pathed update, which Firestore interprets as nested writes.
  const updates = { ...topLevel, updatedAt: now };
  for (const [key, value] of Object.entries(onboardingMap)) {
    updates[`onboarding.${key}`] = value;
  }
  await ref.update(updates);
  return { created: false };
}

/**
 * Admin-only. Return every patient (role === "patient") as a list of
 * plain DTOs for the admin patients table.
 *
 * `orgSlug` scopes the result to a single portal. Pass `null`/`undefined`
 * only from superadmin contexts — that bypasses the tenant filter and
 * returns every patient across every portal. Per-portal admins MUST always
 * pass their own slug.
 */
export async function listAllPatientsForAdmin(orgSlug) {
  let q = adminDb.collection(USERS_COLLECTION).where("role", "==", "patient");
  if (orgSlug) q = q.where("orgSlug", "==", orgSlug);
  const snap = await q.get();

  return snap.docs
    .map((d) => {
      const data = d.data();
      return {
        uid: d.id,
        orgSlug: data.orgSlug || DEFAULT_ORG_SLUG,
        email: data.email || "",
        firstName: data.firstName || data.onboarding?.firstName || "",
        lastName: data.lastName || data.onboarding?.lastName || "",
        fullName:
          [data.firstName || data.onboarding?.firstName, data.lastName || data.onboarding?.lastName]
            .filter(Boolean)
            .join(" ") ||
          data.email ||
          "—",
        phone: data.phone || data.onboarding?.phone || "",
        dob: data.dob || data.onboarding?.dob || "",
        status: data.status || "incomplete",
        onboarding: {
          address: data.onboarding?.address || "",
          zip: data.onboarding?.zip || "",
        },
        createdAtMs:
          typeof data.createdAt?.toMillis === "function"
            ? data.createdAt.toMillis()
            : null,
      };
    })
    .sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
}

/**
 * Admin-only. Full patient profile for the detail view — includes the
 * complete onboarding map and all appointments (any doctor).
 */
export async function adminGetPatientDetail(uid, actingOrgSlug) {
  const ref = adminDb.collection(USERS_COLLECTION).doc(uid);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("Patient not found");
  const data = snap.data();
  if (data.role && data.role !== "patient") {
    throw new Error("Not a patient");
  }
  if (actingOrgSlug && data.orgSlug !== actingOrgSlug) {
    throw new Error("Patient belongs to a different portal");
  }

  const onb = data.onboarding || {};
  const apptSnap = await adminDb
    .collection("appointments")
    .where("patientUid", "==", uid)
    .get();

  const appointments = enrichAppointmentRows(
    apptSnap.docs.map((d) => {
      const a = d.data();
      return {
        id: d.id,
        date: a.date || "",
        time: a.time || "",
        type: a.type || "",
        status: a.status || "scheduled",
        notes: a.notes || "",
        doctorUid: a.doctorUid || "",
        doctorName: a.doctorName || "",
        patientUid: uid,
        durationMinutes: a.durationMinutes || 30,
        prescriptionText: a.prescriptionText || "",
        prescriptionSignatureURL: a.prescriptionSignatureURL || "",
        prescriptionIssued: !!a.prescriptionIssued,
        cancelRemark: a.cancelRemark || "",
      };
    }),
    {
      doctorNames: await loadDisplayNamesByUid(
        apptSnap.docs.map((d) => d.data().doctorUid),
      ),
    },
  ).sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`));

  const onboarding = await resolveOnboardingDoctorLabel(
    mergePaymentIntoOnboarding(data),
  );
  const planPayment = await getPlanPaymentForPatient(uid);

  return {
    uid,
    orgSlug: data.orgSlug || DEFAULT_ORG_SLUG,
    email: data.email || "",
    firstName: data.firstName || onb.firstName || "",
    lastName: data.lastName || onb.lastName || "",
    fullName:
      [data.firstName || onb.firstName, data.lastName || onb.lastName]
        .filter(Boolean)
        .join(" ") ||
      data.email ||
      "Patient",
    phone: data.phone || onb.phone || "",
    dob: data.dob || onb.dob || "",
    status: data.status || "incomplete",
    currentStep: data.currentStep || "",
    consentHIPAA: !!data.consentHIPAA,
    consentTelehealth: !!data.consentTelehealth,
    emailVerified: !!data.emailVerified,
    createdAtMs:
      typeof data.createdAt?.toMillis === "function"
        ? data.createdAt.toMillis()
        : null,
    onboarding: onboarding,
    planPayment,
    appointments,
  };
}

/**
 * Admin-only. Updates editable patient fields. Role is never mutated.
 *
 * `actingOrgSlug` is the caller admin's portal. If supplied, the target
 * patient must belong to the same portal — otherwise we refuse the write.
 * Pass null/undefined ONLY for superadmin callers (cross-portal access).
 */
export async function adminUpdatePatient(uid, fields = {}, actingOrgSlug) {
  const ref = adminDb.collection(USERS_COLLECTION).doc(uid);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("Patient not found");
  const data = snap.data();
  if (data.role && data.role !== "patient") {
    throw new Error("Not a patient");
  }
  if (actingOrgSlug && data.orgSlug !== actingOrgSlug) {
    throw new Error("Patient belongs to a different portal");
  }

  const updates = { updatedAt: FieldValue.serverTimestamp() };
  if (typeof fields.firstName === "string") updates.firstName = fields.firstName.trim();
  if (typeof fields.lastName === "string") updates.lastName = fields.lastName.trim();
  if (typeof fields.phone === "string") {
    const trimmed = fields.phone.trim();
    updates.phone = trimmed ? normalizePhoneForStorage(trimmed) : "";
  }
  if (typeof fields.status === "string") {
    throw new Error(
      "Patient status cannot be changed by admin. It updates when the doctor completes or cancels a visit.",
    );
  }
  if (typeof fields.dob === "string") updates.dob = fields.dob.trim();
  if (typeof fields.address === "string") {
    updates["onboarding.address"] = fields.address.trim().slice(0, 150);
  }
  if (typeof fields.zip === "string") {
    updates["onboarding.zip"] = fields.zip.trim().slice(0, 10);
  }
  // Patient portal (orgSlug) is immutable after signup — never reassigned here.

  const nextFirst =
    typeof fields.firstName === "string" ? fields.firstName.trim() : data.firstName || "";
  const nextLast =
    typeof fields.lastName === "string" ? fields.lastName.trim() : data.lastName || "";
  const nameChanged =
    (typeof fields.firstName === "string" &&
      fields.firstName.trim() !== (data.firstName || "")) ||
    (typeof fields.lastName === "string" &&
      fields.lastName.trim() !== (data.lastName || ""));

  await ref.update(updates);

  if (nameChanged) {
    await cascadePatientName(uid, {
      firstName: nextFirst,
      lastName: nextLast,
      email: data.email || "",
    });
    const fullName = [nextFirst, nextLast].filter(Boolean).join(" ");
    if (fullName) {
      try {
        await adminAuth.updateUser(uid, { displayName: fullName });
      } catch {
        // Auth profile is optional; Firestore is canonical for display names.
      }
    }
  }
}

async function aggregateCount(q) {
  const snap = await q.count().get();
  return snap.data().count;
}

/**
 * Doctor counts for a portal. Uses orgSlugs (multi-portal) — same rule as the
 * admin doctors table — not primary orgSlug alone.
 */
async function countDoctorsByStatus(orgSlug) {
  const base = adminDb.collection(USERS_COLLECTION);

  if (!orgSlug) {
    const [total, active, pending, rejected, deactivated] = await Promise.all([
      aggregateCount(base.where("role", "==", "doctor")),
      aggregateCount(
        base.where("role", "==", "doctor").where("status", "==", "active"),
      ),
      aggregateCount(
        base.where("role", "==", "doctor").where("status", "==", "pending"),
      ),
      aggregateCount(
        base.where("role", "==", "doctor").where("status", "==", "rejected"),
      ),
      aggregateCount(
        base.where("role", "==", "doctor").where("status", "==", "deactivated"),
      ),
    ]);
    return { total, active, pending, rejected, deactivated };
  }

  const snap = await base.where("role", "==", "doctor").get();
  const counts = { total: 0, active: 0, pending: 0, rejected: 0, deactivated: 0 };
  for (const doc of snap.docs) {
    if (!doctorBelongsToPortal(doc.data(), orgSlug)) continue;
    counts.total += 1;
    const status = doc.data().status || "pending";
    if (status === "active") counts.active += 1;
    else if (status === "pending") counts.pending += 1;
    else if (status === "rejected") counts.rejected += 1;
    else if (status === "deactivated") counts.deactivated += 1;
  }
  return counts;
}

/**
 * Counts users grouped by role + status. Used by the admin overview.
 * Returns { patients: { total }, doctors: { total, active, pending, rejected } }.
 *
 * `orgSlug` scopes to one portal. Pass null/undefined for the platform-wide
 * (superadmin) view.
 */
export async function countUsersByRole(orgSlug) {
  const base = adminDb.collection(USERS_COLLECTION);
  const withOrg = (q) => (orgSlug ? q.where("orgSlug", "==", orgSlug) : q);

  const [patientsTotal, doctorCounts, adminsTotal] = await Promise.all([
    aggregateCount(withOrg(base.where("role", "==", "patient"))),
    countDoctorsByStatus(orgSlug),
    aggregateCount(withOrg(base.where("role", "==", "admin"))),
  ]);

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const signupsByDay = {};
  const recentSnap = await base
    .where("createdAt", ">=", Timestamp.fromMillis(thirtyDaysAgo))
    .get();
  for (const d of recentSnap.docs) {
    const data = d.data();
    if (orgSlug && data.orgSlug !== orgSlug) continue;
    const createdMs =
      typeof data.createdAt?.toMillis === "function"
        ? data.createdAt.toMillis()
        : null;
    if (createdMs) {
      const day = new Date(createdMs).toISOString().slice(0, 10);
      signupsByDay[day] = (signupsByDay[day] || 0) + 1;
    }
  }

  return {
    patients: { total: patientsTotal },
    doctors: doctorCounts,
    admins: { total: adminsTotal },
    signupsByDay,
  };
}

/**
 * Take the full client `form` object, promote known scalar fields to
 * top-level on users/{uid}, stash the rest under `onboarding`.
 * Blocklisted fields (password, etc.) are dropped here too.
 */
export function projectFormToUserFields(form = {}) {
  const out = { formSnapshot: {} };
  for (const [key, value] of Object.entries(form)) {
    if (value === undefined) continue;
    if (BLOCKLISTED_FIELDS.has(key)) continue;
    if (TOP_LEVEL_FIELDS.includes(key)) {
      if (key === "phone") {
        const trimmed = String(value || "").trim();
        if (!trimmed) {
          out[key] = "";
        } else if (isValidPhone(trimmed)) {
          out[key] = formatPhoneDisplay(trimmed);
        } else {
          out[key] = trimmed;
        }
      } else {
        out[key] = value;
      }
    } else {
      out.formSnapshot[key] = value;
    }
  }
  return out;
}
