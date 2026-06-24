// app/api/doctors/list/route.js
//
// List of active doctors for the patient-facing booking flow. By the time
// the booking screen (S22b) calls this, the patient has already signed up
// on S20 — so we can rely on auth to scope the result to the patient's
// own portal. Doctors from other portals are never returned.
//
// A superadmin caller gets the cross-portal list (orgSlug filter dropped),
// which is convenient when debugging tenant setups.
//
// State filtering is driven by an explicit `?state=XX` query string. We no
// longer accept (or derive) the patient's state from their ZIP — the
// patient picks their state directly on the profile screen, which is more
// accurate near state borders and matches how licensure actually works.

import { listActiveDoctors } from "@/services/firebase/doctors";
import { ok, scopedOrgSlug, withAuth } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withAuth(async (request, _ctx, auth) => {
  const orgSlug = scopedOrgSlug(auth);
  const url = new URL(request.url);
  const stateParam = url.searchParams.get("state")?.trim().toUpperCase();
  const patientState =
    stateParam && stateParam.length === 2 ? stateParam : null;
  const result = await listActiveDoctors(orgSlug, patientState);
  return ok({
    doctors: result.doctors,
    patientState: result.patientState,
  });
});
