// app/api/admin/overview/route.js
//
// Aggregated stats + chart data for the admin dashboard landing page.
// One round-trip so the UI doesn't have to fan out to half a dozen
// endpoints on load.

import { countUsersByRole } from "@/services/firebase/users";
import { appointmentStatsForAdmin } from "@/services/firebase/appointments";
import { ok, adminOrgScope, withAuth } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withAuth({ role: "admin" }, async (request, _ctx, auth) => {
  const orgSlug = adminOrgScope(auth, request);
  const [users, appts] = await Promise.all([
    countUsersByRole(orgSlug),
    appointmentStatsForAdmin(orgSlug),
  ]);

  // Build a 30-day continuous series so the chart has bars/points for
  // empty days too — easier to reason about visually than a sparse list.
  const days = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    days.push({
      day: key,
      signups: users.signupsByDay[key] || 0,
      bookings: appts.bookedByDay[key] || 0,
    });
  }

  return ok({
    counts: {
      patients: users.patients.total,
      doctorsTotal: users.doctors.total,
      doctorsActive: users.doctors.active,
      doctorsPending: users.doctors.pending,
      doctorsRejected: users.doctors.rejected,
      admins: users.admins.total,
      appointmentsTotal: appts.total,
      appointmentsScheduled: appts.scheduled,
      appointmentsCompleted: appts.completed,
      appointmentsCancelled: appts.cancelled,
    },
    series: days,
  });
});
