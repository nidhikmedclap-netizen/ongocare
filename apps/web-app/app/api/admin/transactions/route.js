// app/api/admin/transactions/route.js
//
// Plan signup payments for the admin Transactions page.
// Portal admins see their portal only; superadmin can filter by org.

import { adminTransactionReport } from "@/services/firebase/transactions";
import { ok, adminOrgScope, withAuth } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withAuth({ role: "admin" }, async (request, _ctx, auth) => {
  const orgSlug = adminOrgScope(auth, request);
  const report = await adminTransactionReport(orgSlug);
  return ok(report);
});
