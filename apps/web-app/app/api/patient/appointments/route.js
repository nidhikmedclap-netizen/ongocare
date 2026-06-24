// app/api/patient/appointments/route.js
//
// GET: every appointment booked by the signed-in patient.

import { listAppointmentsForPatient } from "@/services/firebase/appointments";
import { ok, withAuth } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withAuth({ role: "patient" }, async (_request, _ctx, { user }) => {
  const appointments = await listAppointmentsForPatient(user.uid);
  return ok({ appointments });
});
