// app/api/admin/appointments/route.js
//
// GET — every appointment in the platform, most recent first.

import { listAllAppointmentsForAdmin } from "@/services/firebase/appointments";
import { ok, adminOrgScope, withAuth } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withAuth({ role: "admin" }, async (request, _ctx, auth) => {
  const orgSlug = adminOrgScope(auth, request);
  const appointments = await listAllAppointmentsForAdmin(orgSlug);
  return ok({ appointments });
});
