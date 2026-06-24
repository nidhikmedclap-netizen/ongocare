// app/api/doctor/appointments/[id]/route.js
//
// PATCH a single appointment — the doctor can update notes, status, or
// appointment type. We verify both the token AND that the appointment
// actually belongs to the signed-in doctor before allowing the write.

import {
  getAppointment,
  updateAppointment,
} from "@/services/firebase/appointments";
import { fail, ok, withAuth } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const PATCH = withAuth(
  { role: "doctor", activeDoctor: true },
  async (request, { params }, { user }) => {
    const { id } = params || {};
    if (!id) return fail("Missing id", 400);

    const existing = await getAppointment(id);
    if (!existing) return fail("Not found", 404);
    if (existing.doctorUid !== user.uid) return fail("Forbidden", 403);

    const body = await request.json().catch(() => ({}));
    try {
      await updateAppointment(id, body);
    } catch (e) {
      if (e?.code === "CANCEL_REMARK_REQUIRED") {
        return fail("Please provide a reason for cancellation.", 400);
      }
      if (e?.code === "PRESCRIPTION_TEXT_REQUIRED") {
        return fail("Prescription could not be saved — patient details may still be loading.", 400);
      }
      if (e?.code === "APPOINTMENT_STATUS_LOCKED") {
        return fail(e.message, 400);
      }
      if (e?.code === "APPOINTMENT_LOCKED") {
        return fail(e.message, 400);
      }
      throw e;
    }
    const updated = await getAppointment(id);
    return ok({ appointment: updated });
  },
);
