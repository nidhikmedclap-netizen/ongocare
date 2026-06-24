// app/api/doctor/availability/route.js
//
// Doctor's own availability — GET fetches their current schedule (or a
// sensible default if they haven't saved one yet), PUT overwrites it.
// Auth: Firebase ID token of a user whose role === "doctor".
//
// Timezone is derived from the doctor's home state (not client-editable).

import { FieldValue } from "firebase-admin/firestore";
import {
  getOrDefaultAvailability,
  setAvailability,
} from "@/services/firebase/availability";
import {
  licensedStatesFromLicenses,
  resolveHomeState,
  sanitizeHomeStateSelection,
} from "@/lib/doctor/homeState";
import { adminDb } from "@/lib/firebase/admin";
import { fail, ok, withAuth } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function loadDoctorSchedulingContext(uid) {
  const snap = await adminDb.collection("users").doc(uid).get();
  const data = snap.data() || {};
  const licenses = Array.isArray(data.licenses) ? data.licenses : [];
  const licensedStates = licensedStatesFromLicenses(licenses);
  const homeState = resolveHomeState({
    homeState: data.homeState,
    licenses,
    licensedStates,
  });
  return { licenses, licensedStates, homeState };
}

export const GET = withAuth({ role: "doctor", activeDoctor: true }, async (_request, _ctx, { user }) => {
  const ctx = await loadDoctorSchedulingContext(user.uid);
  const availability = await getOrDefaultAvailability(user.uid, {
    homeState: ctx.homeState,
  });
  return ok({
    availability,
    homeState: ctx.homeState,
    licensedStates: ctx.licensedStates,
  });
});

export const PUT = withAuth({ role: "doctor", activeDoctor: true }, async (request, _ctx, { user }) => {
  const body = await request.json().catch(() => ({}));
  const ctx = await loadDoctorSchedulingContext(user.uid);

  let homeState = ctx.homeState;
  if (body.homeState !== undefined) {
    const next = sanitizeHomeStateSelection(body.homeState, ctx.licensedStates);
    if (!next) {
      return fail("Home state must be one of your licensed states.", 400);
    }
    homeState = next;
    if (homeState !== ctx.homeState) {
      await adminDb.collection("users").doc(user.uid).update({
        homeState,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  }

  const {
    homeState: _homeState,
    licensedStates: _licensedStates,
    timezone: _timezone,
    doctorUid: _doctorUid,
    ...availInput
  } = body;

  const saved = await setAvailability(user.uid, availInput, { homeState });
  return ok({
    availability: { doctorUid: user.uid, ...saved },
    homeState,
    licensedStates: ctx.licensedStates,
  });
});
