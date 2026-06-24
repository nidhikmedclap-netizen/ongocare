// app/api/doctor/transactions/route.js
//
// Plan signup earnings for patients assigned to the signed-in doctor.

import { doctorTransactionReport } from "@/services/firebase/transactions";
import { ok, withAuth } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withAuth({ role: "doctor", activeDoctor: true }, async (_request, _ctx, { user }) => {
  const report = await doctorTransactionReport(user.uid);
  return ok(report);
});
