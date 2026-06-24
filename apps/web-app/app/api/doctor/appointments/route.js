// app/api/doctor/appointments/route.js
//
// GET: every appointment booked with the signed-in doctor.

import { listAppointmentsForDoctor } from "@/services/firebase/appointments";
import { ok, withAuth } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withAuth({ role: "doctor", activeDoctor: true }, async (_request, _ctx, { user }) => {
  const appointments = await listAppointmentsForDoctor(user.uid);
  return ok({ appointments });
});
