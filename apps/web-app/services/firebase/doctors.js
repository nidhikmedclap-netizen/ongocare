// services/firebase/doctors.js
//
// Server-side helpers for querying users with role === "doctor".
// All functions use the Admin SDK and bypass Firestore Security Rules —
// invoke only from trusted server code.

import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { sanitizeStoredFile } from "@/lib/storage/metadata";
import {
  resolveDoctorPhotoURLForDisplay,
  resolveDoctorSignatureURLForDisplay,
} from "@/lib/storage/doctorPhotoDisplay";
import { normalizePhoneForStorage } from "@/lib/phone/usPhone";
import { licenseStateKey } from "@/app/weightloss-onboard/utils";
import { normalizeSlotDurationMinutes } from "@/lib/appointments/slotDuration";
import {
  parseDoctorProfileBody,
  assertNoDuplicateLicenseNumbersInList,
  assertNoDuplicateStateLicenseTypesInList,
  sanitizeLicenses,
} from "@/services/firebase/doctorProfileFields";
import {
  DOCTOR_PAYOUT_ACCOUNTS_COLLECTION,
  getDoctorBankingForAdmin,
  getDoctorVisitPaymentCents,
  migrateLegacyDoctorPayoutAccount,
  upsertDoctorPayoutAccount,
} from "@/services/firebase/doctorPayoutAccounts";
import { normalizeOrgSlug } from "@/services/firebase/users";
import {
  inferHomeStateFromLicenses,
  licensedStatesFromLicenses,
  resolveHomeState,
  sanitizeHomeStateSelection,
} from "@/lib/doctor/homeState";
import { getAvailability, setAvailability } from "@/services/firebase/availability";
import {
  doctorBelongsToPortal,
  resolveDoctorOrgSlugs,
  sanitizeDoctorOrgSlugsInput,
} from "@/lib/orgs/doctorPortals";
import {
  parsePortalPriority,
  resolveDoctorPriorityForPortal,
  withPortalPriority,
  normalizedPortalPriorities,
} from "@/lib/orgs/doctorPortalPriority";
import {
  cascadeDoctorName,
  fullNameFromUserData,
} from "@/services/firebase/nameSync";

const USERS_COLLECTION = "users";

// Number of doctors surfaced in the patient picker. Hard-coded because
// the picker UI was designed around "meet your physician" with a small
// curated set; if this changes the screen layout needs a redesign too.
const PUBLIC_DOCTOR_LIMIT = 3;

/**
 * Returns active doctors licensed in the patient's state for the picker.
 *
 *   { doctors, patientState }
 *
 * Priority is a 1-based rank: the admin sets 1, 2, 3… and the patient picker
 * surfaces the lowest numbers first among eligible clinicians.
 *
 * Selection rules:
 *   1. Active doctors only, scoped to the patient's portal via `orgSlug`.
 *   2. Doctor must hold a license in the patient's state (`licensedStates`
 *      is derived from every entry in `licenses[]`, so multi-state doctors
 *      qualify when any license matches).
 *   3. Return up to PUBLIC_DOCTOR_LIMIT matches, ordered by priority.
 *   4. If none match (or patient state is missing), return an empty list —
 *      we never show out-of-state doctors as a fallback.
 */
export async function listActiveDoctors(orgSlug, patientState) {
  const snap = await adminDb
    .collection(USERS_COLLECTION)
    .where("role", "==", "doctor")
    .where("status", "==", "active")
    .get();

  const stateFilter =
    typeof patientState === "string" && patientState.length === 2
      ? patientState.toUpperCase()
      : null;

  if (!stateFilter) {
    return { doctors: [], patientState: null };
  }

  const all = snap.docs
    .map((d) => {
      const data = d.data();
      if (orgSlug && !doctorBelongsToPortal(data, orgSlug)) return null;
      const rank = resolveDoctorPriorityForPortal(data, orgSlug);
      const sortRank = rank >= 1 ? rank : Infinity;
      return { ...projectDoctor(d.id, data), priority: sortRank };
    })
    .filter(Boolean);

  const sortByPriority = (a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.fullName.localeCompare(b.fullName);
  };

  const inState = all
    .filter((doc) => (doc.licensedStates || []).includes(stateFilter))
    .sort(sortByPriority);

  const doctors = inState
    .slice(0, PUBLIC_DOCTOR_LIMIT)
    .map(({ priority: _p, ...rest }) => rest);

  return { doctors, patientState: stateFilter };
}

/**
 * Ensures each state + license number pair is not already registered on
 * another doctor. The same license number may appear in different states.
 * Comparison is case-insensitive (CA|ME-12345 === ca|me-12345).
 *
 * @param {Array<{ state: string, licenseNumber: string }>} licenses
 * @param {{ excludeUid?: string }} options — skip this doctor uid (updates)
 */
export async function assertLicenseNumbersGloballyUnique(
  licenses,
  { excludeUid } = {},
) {
  const incoming = new Map(
    (licenses || [])
      .map((l) => {
        const key = licenseStateKey(l?.state, l?.licenseNumber);
        return key ? [key, { state: l.state, licenseNumber: l.licenseNumber }] : null;
      })
      .filter(Boolean),
  );
  if (incoming.size === 0) return;

  const snap = await adminDb
    .collection(USERS_COLLECTION)
    .where("role", "==", "doctor")
    .get();

  for (const doc of snap.docs) {
    if (excludeUid && doc.id === excludeUid) continue;
    const docLicenses = Array.isArray(doc.data().licenses)
      ? doc.data().licenses
      : [];
    for (const lic of docLicenses) {
      const key = licenseStateKey(lic?.state, lic?.licenseNumber);
      if (key && incoming.has(key)) {
        const { state, licenseNumber } = incoming.get(key);
        throw new Error(
          `License number "${licenseNumber}" in ${state} is already registered to another clinician.`,
        );
      }
    }
  }
}

/**
 * Look up a single doctor by uid. Returns null if not a doctor.
 */
export async function getDoctor(uid) {
  const snap = await adminDb.collection(USERS_COLLECTION).doc(uid).get();
  if (!snap.exists) return null;
  const data = snap.data();
  if (data.role !== "doctor") return null;
  return { ...projectDoctor(snap.id, data), status: data.status || "pending" };
}

/**
 * Admin-only helper. Returns EVERY doctor (pending, active, rejected,
 * deactivated), with priority + status fields included so the admin
 * table can render them.
 *
 * `orgSlug` scopes to a single portal. Null/undefined ⇒ all portals
 * (superadmin view only).
 */
export async function listAllDoctorsForAdmin(orgSlug, { maskOtherPortals = false } = {}) {
  const snap = await adminDb
    .collection(USERS_COLLECTION)
    .where("role", "==", "doctor")
    .get();

  const filtered = snap.docs.filter(
    (d) => !orgSlug || doctorBelongsToPortal(d.data(), orgSlug),
  );
  const payoutRefs = filtered.map((d) =>
    adminDb.collection(DOCTOR_PAYOUT_ACCOUNTS_COLLECTION).doc(d.id),
  );
  const payoutSnaps =
    payoutRefs.length > 0 ? await adminDb.getAll(...payoutRefs) : [];
  const payoutByUid = new Map(
    payoutSnaps
      .filter((s) => s.exists)
      .map((s) => [s.id, s.data()?.appointmentPaymentCents ?? null]),
  );

  const rows = await Promise.all(
    filtered.map(async (d) => {
      const data = d.data();
      const appointmentPaymentCents = payoutByUid.get(d.id) ?? null;
      const photoURL = await resolveDoctorPhotoURLForDisplay(data);
      const allOrgSlugs = resolveDoctorOrgSlugs(data);
      const portalSlug = orgSlug ? normalizeOrgSlug(orgSlug) : null;
      const visibleOrgSlugs =
        maskOtherPortals && portalSlug
          ? allOrgSlugs.filter((s) => s === portalSlug)
          : allOrgSlugs;
      return {
        ...projectDoctor(d.id, data),
        photoURL,
        orgSlug: data.orgSlug || null,
        orgSlugs: visibleOrgSlugs,
        status: data.status || "pending",
        priority: portalSlug
          ? resolveDoctorPriorityForPortal(data, portalSlug)
          : 0,
        appointmentPaymentCents,
        rejectionRemark:
          typeof data.rejectionRemark === "string" ? data.rejectionRemark : "",
        createdAtMs:
          typeof data.createdAt?.toMillis === "function"
            ? data.createdAt.toMillis()
            : null,
      };
    }),
  );

  const STATUS_SORT = {
    pending: 0,
    active: 1,
    rejected: 2,
    deactivated: 3,
  };

  return rows.sort((a, b) => {
    const sa = STATUS_SORT[a.status] ?? 9;
    const sb = STATUS_SORT[b.status] ?? 9;
    if (sa !== sb) return sa - sb;

    // New applications needing review bubble to the top (newest signup first).
    if (a.status === "pending" && b.status === "pending") {
      const createdDiff = (b.createdAtMs || 0) - (a.createdAtMs || 0);
      if (createdDiff !== 0) return createdDiff;
    }

    // Active roster: ascending priority (1 first) for patient-picker order.
    const ra = a.priority >= 1 ? a.priority : Infinity;
    const rb = b.priority >= 1 ? b.priority : Infinity;
    if (ra !== rb) return ra - rb;
    return a.fullName.localeCompare(b.fullName);
  });
}

/**
 * Admin-only. Full doctor profile for the detail view — licenses, banking,
 * prescription template, signature, and weekly availability.
 */
export async function adminGetDoctorDetail(
  uid,
  actingOrgSlug,
  { revealFullBanking = false, maskOtherPortals = false } = {},
) {
  const ref = adminDb.collection(USERS_COLLECTION).doc(uid);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("Doctor not found");
  const data = snap.data();
  if (data.role !== "doctor") throw new Error("Not a doctor");
  if (actingOrgSlug && !doctorBelongsToPortal(data, actingOrgSlug)) {
    throw new Error("Doctor belongs to a different portal");
  }

  // Ensure legacy users/{uid}.banking is migrated before we read payout data.
  await migrateLegacyDoctorPayoutAccount(uid, data);

  const availability = await getAvailability(uid);
  const doctorProfile = data.doctorProfile || {};
  const appointmentPaymentCents = await getDoctorVisitPaymentCents(uid);
  const banking = await getDoctorBankingForAdmin(uid, revealFullBanking);
  const photoURL = await resolveDoctorPhotoURLForDisplay(data);
  const signatureURL = await resolveDoctorSignatureURLForDisplay(data);

  const allOrgSlugs = resolveDoctorOrgSlugs(data);
  const portalSlug = actingOrgSlug ? normalizeOrgSlug(actingOrgSlug) : null;
  const visibleOrgSlugs =
    maskOtherPortals && portalSlug
      ? allOrgSlugs.filter((s) => s === portalSlug)
      : allOrgSlugs;

  return {
    uid,
    ...projectDoctor(uid, data),
    photoURL,
    orgSlug: data.orgSlug || null,
    orgSlugs: visibleOrgSlugs,
    status: data.status || "pending",
    priority: portalSlug ? resolveDoctorPriorityForPortal(data, portalSlug) : 0,
    appointmentPaymentCents,
    rejectionRemark:
      typeof data.rejectionRemark === "string" ? data.rejectionRemark : "",
    emailVerified: !!data.emailVerified,
    createdAtMs:
      typeof data.createdAt?.toMillis === "function"
        ? data.createdAt.toMillis()
        : null,
    banking,
    prescriptionTemplate: doctorProfile.prescriptionTemplate || "",
    headshot: doctorProfile.headshot || null,
    signatureURL,
    signature: doctorProfile.signature || null,
    signatureDataUrl: doctorProfile.signatureDataUrl || "",
    availability: availability
      ? {
          timezone: availability.timezone || "America/New_York",
          slotDurationMinutes: normalizeSlotDurationMinutes(
            availability.slotDurationMinutes,
          ),
          weeklySchedule: availability.weeklySchedule || {},
          blockedDates: availability.blockedDates || [],
        }
      : null,
  };
}

/**
 * Ensures no other doctor on the same portal already holds this priority rank.
 */
async function assertPortalPriorityUnique(orgSlug, priority, excludeUid) {
  const portalSlug = normalizeOrgSlug(orgSlug);
  const snap = await adminDb
    .collection(USERS_COLLECTION)
    .where("role", "==", "doctor")
    .get();

  for (const doc of snap.docs) {
    if (doc.id === excludeUid) continue;
    const other = doc.data();
    if (!doctorBelongsToPortal(other, portalSlug)) continue;
    if (resolveDoctorPriorityForPortal(other, portalSlug) === priority) {
      throw new Error(
        `Priority ${priority} is already assigned to another doctor on this portal.`,
      );
    }
  }
}

/**
 * Admin-only helper. Updates the mutable admin-controlled fields on a
 * doctor: status, priority, and editable profile bits. No-op for fields
 * not supplied.
 *
 * `actingOrgSlug` enforces tenant isolation — only a same-portal admin
 * (or a superadmin passing null) can mutate this doctor.
 */
export async function adminUpdateDoctor(uid, fields = {}, actingOrgSlug) {
  const ref = adminDb.collection(USERS_COLLECTION).doc(uid);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("Doctor not found");
  const data = snap.data();
  if (data.role !== "doctor") throw new Error("Not a doctor");
  if (actingOrgSlug && !doctorBelongsToPortal(data, actingOrgSlug)) {
    throw new Error("Doctor belongs to a different portal");
  }

  const updates = { updatedAt: FieldValue.serverTimestamp() };

  if (typeof fields.status === "string") {
    const next = fields.status;
    if (!["pending", "active", "rejected", "deactivated"].includes(next)) {
      throw new Error("Invalid status");
    }
    if (next === "rejected") {
      const remark =
        typeof fields.rejectionRemark === "string"
          ? fields.rejectionRemark.trim()
          : "";
      if (!remark) {
        throw new Error("Rejection reason is required.");
      }
      updates.rejectionRemark = remark.slice(0, 500);
    }
    updates.status = next;
  }
  if (typeof fields.rejectionRemark === "string" && !fields.status) {
    updates.rejectionRemark = fields.rejectionRemark.trim().slice(0, 500);
  }
  if (Object.prototype.hasOwnProperty.call(fields, "priority")) {
    if (!actingOrgSlug) {
      throw new Error("Select a portal before setting doctor priority.");
    }
    const portalSlug = normalizeOrgSlug(actingOrgSlug);
    if (!doctorBelongsToPortal(data, portalSlug)) {
      throw new Error("Doctor is not assigned to this portal.");
    }
    const n = parsePortalPriority(fields.priority);
    if (n == null) {
      throw new Error("Priority must be a whole number of 1 or higher");
    }
    await assertPortalPriorityUnique(portalSlug, n, uid);
    updates.portalPriorities = withPortalPriority(data, portalSlug, n);
    // Drop legacy global priority so it cannot leak across portals.
    updates.priority = FieldValue.delete();
  }
  if (Object.prototype.hasOwnProperty.call(fields, "appointmentPaymentCents")) {
    const n = Number(fields.appointmentPaymentCents);
    if (!Number.isInteger(n) || n < 0 || n > 99999999) {
      throw new Error("Visit payment must be a whole number of cents (0 or higher).");
    }
    await upsertDoctorPayoutAccount(uid, {
      orgSlug: data.orgSlug,
      appointmentPaymentCents: n,
    });
  }
  if (typeof fields.firstName === "string") updates.firstName = fields.firstName.trim();
  if (typeof fields.lastName === "string") updates.lastName = fields.lastName.trim();
  if (typeof fields.phone === "string") {
    const trimmed = fields.phone.trim();
    updates.phone = trimmed ? normalizePhoneForStorage(trimmed) : "";
  }
  if (typeof fields.bio === "string") updates.bio = fields.bio.trim();
  if (Array.isArray(fields.licenses)) {
    const licenses = sanitizeLicenses(fields.licenses);
    if (licenses.length === 0) {
      throw new Error("At least one license is required.");
    }
    assertNoDuplicateLicenseNumbersInList(licenses);
    assertNoDuplicateStateLicenseTypesInList(licenses);
    await assertLicenseNumbersGloballyUnique(licenses, { excludeUid: uid });
    updates.licenses = licenses;
  }
  if (fields.banking && typeof fields.banking === "object") {
    await upsertDoctorPayoutAccount(uid, {
      orgSlug: data.orgSlug,
      banking: fields.banking,
    });
  }
  if (typeof fields.prescriptionTemplate === "string") {
    const template = fields.prescriptionTemplate.trim().slice(0, 4000);
    if (template.length > 0 && template.length < 30) {
      throw new Error("Prescription template is too short.");
    }
    updates["doctorProfile.prescriptionTemplate"] = template;
  }
  if (typeof fields.photoURL === "string" && fields.photoURL.startsWith("http")) {
    updates.photoURL = fields.photoURL;
  }
  const headshot = sanitizeStoredFile(fields.headshot);
  if (headshot) {
    updates["doctorProfile.headshot"] = headshot;
  }
  const signatureMeta = sanitizeStoredFile(fields.signature);
  if (signatureMeta) {
    updates["doctorProfile.signature"] = signatureMeta;
  }
  if (typeof fields.signatureURL === "string") {
    if (fields.signatureURL.startsWith("http")) {
      updates["doctorProfile.signatureURL"] = fields.signatureURL.slice(0, 2048);
      updates["doctorProfile.signatureDataUrl"] = "";
    } else if (fields.signatureURL === "") {
      updates["doctorProfile.signatureURL"] = "";
    }
  }
  if (typeof fields.signatureDataUrl === "string") {
    if (fields.signatureDataUrl.startsWith("data:image/")) {
      updates["doctorProfile.signatureDataUrl"] = fields.signatureDataUrl.slice(
        0,
        500000,
      );
      if (!fields.signatureURL?.startsWith("http")) {
        updates["doctorProfile.signatureURL"] = "";
      }
    } else if (fields.signatureDataUrl === "") {
      updates["doctorProfile.signatureDataUrl"] = "";
    }
  }
  if (typeof fields.homeState === "string") {
    const licenseList = Array.isArray(fields.licenses)
      ? sanitizeLicenses(fields.licenses)
      : data.licenses || [];
    const licensedStates = licensedStatesFromLicenses(licenseList);
    const next = sanitizeHomeStateSelection(fields.homeState, licensedStates);
    if (!next) {
      throw new Error("Home state must be one of the doctor's licensed states.");
    }
    updates.homeState = next;
  }
  if (Array.isArray(fields.licenses) && !Object.prototype.hasOwnProperty.call(fields, "homeState")) {
    const licensedStates = licensedStatesFromLicenses(updates.licenses);
    const currentHome = resolveHomeState({
      homeState: data.homeState,
      licensedStates,
    });
    if (currentHome !== (data.homeState || "")) {
      updates.homeState = currentHome;
    }
  }
  if (fields.availability && typeof fields.availability === "object") {
    const homeState = resolveHomeState({
      homeState: updates.homeState ?? data.homeState,
      licenses: updates.licenses ?? data.licenses,
    });
    await setAvailability(uid, fields.availability, { homeState });
  }

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
    const fullName = fullNameFromUserData(
      { firstName: nextFirst, lastName: nextLast, email: data.email },
      data.email || "Doctor",
    );
    await cascadeDoctorName(uid, fullName);
    try {
      await adminAuth.updateUser(uid, { displayName: fullName });
    } catch {
      // Auth profile is optional; Firestore is canonical for display names.
    }
  }
}

/**
 * Super-admin only. Assigns a doctor to one or more portals.
 * Keeps orgSlug as the primary/home portal when still assigned.
 */
export async function adminSetDoctorPortals(uid, orgSlugsInput) {
  const ref = adminDb.collection(USERS_COLLECTION).doc(uid);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("Doctor not found");
  if (snap.data().role !== "doctor") throw new Error("Not a doctor");

  const orgSlugs = sanitizeDoctorOrgSlugsInput(
    Array.isArray(orgSlugsInput) ? orgSlugsInput : [orgSlugsInput],
  );
  const existingPrimary = normalizeOrgSlug(snap.data().orgSlug);
  const orgSlug = orgSlugs.includes(existingPrimary) ? existingPrimary : orgSlugs[0];

  const updates = {
    orgSlug,
    orgSlugs,
    updatedAt: FieldValue.serverTimestamp(),
  };

  const existingPriorities = snap.data().portalPriorities;
  if (existingPriorities && typeof existingPriorities === "object") {
    const pruned = {};
    for (const slug of orgSlugs) {
      const key = normalizeOrgSlug(slug);
      const normalized = normalizedPortalPriorities({ portalPriorities: existingPriorities });
      if (normalized[key] != null) {
        pruned[key] = normalized[key];
      }
    }
    updates.portalPriorities = pruned;
  }

  await ref.update(updates);
  return { orgSlug, orgSlugs };
}

/** @deprecated Use adminSetDoctorPortals — kept for single-portal callers. */
export async function adminReassignDoctorPortal(uid, orgSlug) {
  return adminSetDoctorPortals(uid, [orgSlug]);
}

/**
 * Super-admin only. Creates a Firebase Auth user and a fully-populated
 * users/{uid} doctor document in one shot. Doctors created this way land
 * as `active` by default (configurable) so they can log in immediately
 * without waiting for portal-admin approval.
 *
 * Returns { uid, email }.
 */
export async function adminCreateDoctor(body = {}) {
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !email.includes("@")) throw new Error("Valid email is required.");
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    throw new Error("Password must include at least one letter and one number.");
  }

  const profile = parseDoctorProfileBody(body);
  await assertLicenseNumbersGloballyUnique(profile.licenses);
  const orgSlug = normalizeOrgSlug(body.orgSlug);
  const status =
    body.status === "pending" ||
    body.status === "rejected" ||
    body.status === "deactivated"
      ? body.status
      : "active";

  // Fail fast if the email is already taken in Firebase Auth.
  const existing = await adminAuth.getUserByEmail(email).catch(() => null);
  if (existing) {
    throw new Error("That email is already registered.");
  }

  const userRecord = await adminAuth.createUser({
    email,
    password,
    displayName: `${profile.firstName} ${profile.lastName}`.trim(),
    emailVerified: false,
  });
  const uid = userRecord.uid;
  const now = FieldValue.serverTimestamp();

  const {
    prescriptionTemplate,
    signatureURL,
    signature,
    signatureDataUrl,
    headshot,
    banking,
    ...restProfile
  } = profile;

  await adminDb.collection(USERS_COLLECTION).doc(uid).set({
    role: "doctor",
    orgSlug,
    orgSlugs: [orgSlug],
    status,
    portalPriorities: {},
    priority: 0,
    email,
    ...restProfile,
    doctorProfile: {
      prescriptionTemplate,
      headshot: headshot || null,
      signatureURL,
      signature: signature || null,
      signatureDataUrl,
    },
    emailVerified: false,
    createdAt: now,
    updatedAt: now,
  });

  if (banking) {
    await upsertDoctorPayoutAccount(uid, { orgSlug, banking });
  }

  if (body.availability && typeof body.availability === "object") {
    try {
      await setAvailability(uid, body.availability, {
        homeState: profile.homeState || inferHomeStateFromLicenses(profile.licenses),
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("[adminCreateDoctor] availability seed failed:", err);
    }
  }

  return { uid, email };
}

function projectDoctor(uid, data) {
  const licenses = Array.isArray(data.licenses) ? data.licenses : [];
  const licensedStates = licensedStatesFromLicenses(licenses);
  return {
    uid,
    firstName: data.firstName || "",
    lastName: data.lastName || "",
    fullName:
      [data.firstName, data.lastName].filter(Boolean).join(" ") || "Doctor",
    email: data.email || "",
    phone: data.phone || "",
    bio: data.bio || "",
    photoURL: data.photoURL || "",
    licenses: licenses.map((l) => ({
      state: l.state || "",
      licenseNumber: l.licenseNumber || "",
      licenseType: l.licenseType || "",
    })),
    licensedStates,
    homeState: resolveHomeState({
      homeState: data.homeState,
      licenses,
      licensedStates,
    }),
  };
}
