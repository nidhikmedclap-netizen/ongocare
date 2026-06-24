// app/api/admin/patients/route.js
//
// GET — returns every patient (role === "patient") for the admin
// patients table.

import { listAllPatientsForAdmin } from "@/services/firebase/users";
import { ok, adminOrgScope, withAuth } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withAuth({ role: "admin" }, async (request, _ctx, auth) => {
  const orgSlug = adminOrgScope(auth, request);
  const patients = await listAllPatientsForAdmin(orgSlug);
  return ok({ patients });
});
