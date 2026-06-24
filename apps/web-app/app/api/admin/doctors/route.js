// app/api/admin/doctors/route.js
//
// GET — returns every doctor (any status), with priority field, for the
// admin doctors table.

import { listAllDoctorsForAdmin, adminCreateDoctor } from "@/services/firebase/doctors";
import { fail, ok, adminOrgScope, withAuth } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withAuth({ role: "admin" }, async (request, _ctx, auth) => {
  const orgSlug = adminOrgScope(auth, request);
  const doctors = await listAllDoctorsForAdmin(orgSlug, {
    maskOtherPortals: !auth.isSuper,
  });
  return ok({ doctors });
});

export const POST = withAuth({ role: "admin" }, async (request, _ctx, auth) => {
  if (!auth.isSuper) {
    return fail("Only super-admin can create doctors", 403);
  }
  const body = await request.json().catch(() => ({}));
  try {
    const created = await adminCreateDoctor(body);
    return ok(created);
  } catch (err) {
    const message = err?.message || "Could not create doctor";
    const code = err?.code;
    if (code === "auth/email-already-exists") {
      return fail("That email is already registered.", 400);
    }
    return fail(message, 400);
  }
});
