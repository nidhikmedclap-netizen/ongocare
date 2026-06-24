// app/api/admin/appointments/[id]/route.js
//
// PATCH — super-admin cancel (status + reason).
// DELETE — disabled; appointments must be cancelled, not deleted.

import {
  adminGetAppointmentDetail,
  getAppointment,
  updateAppointment,
} from "@/services/firebase/appointments";
import { SUPERADMIN_DELETE_DENIED, SUPERADMIN_MUTATION_DENIED } from "@/lib/admin/access";
import { fail, ok, adminOrgScope, withAuth } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Tenant guard for super-admin appointment mutations.
async function assertCanTouch(id, actingOrgSlug) {
  if (!actingOrgSlug) return;
  const appt = await getAppointment(id);
  // No appointment ⇒ let the downstream operation 404 naturally.
  if (!appt) return;
  if (appt.orgSlug && appt.orgSlug !== actingOrgSlug) {
    throw new Error("Appointment belongs to a different portal");
  }
}

export const GET = withAuth(
  { role: "admin" },
  async (request, { params }, auth) => {
    const id = params?.id;
    if (!id) return fail("Missing id", 400);
    try {
      const appointment = await adminGetAppointmentDetail(
        id,
        adminOrgScope(auth, request),
      );
      if (!appointment) return fail("Not found", 404);
      return ok({ appointment });
    } catch (err) {
      const msg = err?.message || "Not found";
      const status = msg.includes("different portal") ? 403 : 404;
      return fail(msg, status);
    }
  },
);

export const PATCH = withAuth(
  { role: "admin" },
  async (request, { params }, auth) => {
    if (!auth.isSuper) {
      return fail(SUPERADMIN_MUTATION_DENIED, 403);
    }
    const id = params?.id;
    if (!id) return fail("Missing id", 400);
    const acting = adminOrgScope(auth, request);
    const body = await request.json().catch(() => ({}));
    try {
      await assertCanTouch(id, acting);
      await updateAppointment(id, body);
    } catch (err) {
      return fail(err?.message || "Update failed", 400);
    }
    return ok();
  },
);

export const DELETE = withAuth(
  { role: "admin" },
  async (_request, _ctx, auth) => {
    if (auth.isSuper) {
      return fail(
        "Appointments cannot be deleted. Cancel the appointment instead.",
        403,
      );
    }
    return fail(SUPERADMIN_DELETE_DENIED, 403);
  },
);
