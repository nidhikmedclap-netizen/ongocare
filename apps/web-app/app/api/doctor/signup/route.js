// app/api/doctor/signup/route.js
//
// Called by the doctor registration page after the client creates a Firebase
// Auth account and (optionally) uploads a headshot. We verify the ID token,
// then write users/{uid} with role="doctor", profile/clinical metadata, and
// seed availability/{uid} with the captured weekly schedule so patients can
// start booking immediately.

import {
  DEFAULT_ORG_SLUG,
  normalizeOrgSlug,
  upsertUser,
} from "@/services/firebase/users";
import { parseDoctorProfileBody } from "@/services/firebase/doctorProfileFields";
import { setAvailability } from "@/services/firebase/availability";
import { upsertDoctorPayoutAccount } from "@/services/firebase/doctorPayoutAccounts";
import { assertLicenseNumbersGloballyUnique } from "@/services/firebase/doctors";
import { adminDb } from "@/lib/firebase/admin";
import { fail, ok, withAuth } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// withAuth (no role) — the user has a Firebase Auth account but no
// Firestore user doc yet; this endpoint is what creates it with role=doctor.
export const POST = withAuth(async (request, _ctx, { decoded }) => {
  const existingSnap = await adminDb.collection("users").doc(decoded.uid).get();
  if (existingSnap.exists) {
    const existingRole = existingSnap.data()?.role;
    if (existingRole && existingRole !== "doctor") {
      return fail(
        "An account already exists with a different role. Use a new email to register as a doctor.",
        403,
      );
    }
  }

  const body = await request.json().catch(() => ({}));

  let profile;
  try {
    profile = parseDoctorProfileBody(body);
    await assertLicenseNumbersGloballyUnique(profile.licenses, {
      excludeUid: decoded.uid,
    });
  } catch (err) {
    return fail(err?.message || "Invalid profile", 400);
  }

  const {
    prescriptionTemplate,
    signatureURL,
    signature,
    signatureDataUrl,
    headshot,
    banking,
    ...restProfile
  } = profile;

  const orgSlug = normalizeOrgSlug(body.orgSlug || DEFAULT_ORG_SLUG);

  await upsertUser(decoded.uid, {
    role: "doctor",
    orgSlug,
    orgSlugs: [orgSlug],
    status: "pending",
    portalPriorities: {},
    priority: 0,
    email: decoded.email || "",
    ...restProfile,
    doctorProfile: {
      prescriptionTemplate,
      headshot: headshot || null,
      signatureURL,
      signature: signature || null,
      signatureDataUrl,
    },
    emailVerified: !!decoded.email_verified,
  });

  await upsertDoctorPayoutAccount(decoded.uid, { orgSlug, banking });

  if (body.availability && typeof body.availability === "object") {
    try {
      await setAvailability(decoded.uid, body.availability, {
        homeState: restProfile.homeState,
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("[doctor/signup] availability seed failed:", err);
    }
  }

  return ok();
});
