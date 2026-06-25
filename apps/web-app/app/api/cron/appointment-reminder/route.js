// app/api/cron/appointment-reminder/route.js
//
// Cron (every minute): send appointment reminder ~2 minutes before start.

import { fail, ok } from "@/lib/api";
import { runAppointmentReminderCron } from "@/services/emails/runAppointmentReminderCron";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorizeCron(request) {
  const secret = String(process.env.CRON_SECRET || "").trim();
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function GET(request) {
  // eslint-disable-next-line no-console
  console.log("\n[cron/appointment-reminder] ▶ HTTP request received at", new Date().toISOString());

  if (!authorizeCron(request)) {
    // eslint-disable-next-line no-console
    console.warn("[cron/appointment-reminder] ✗ NOT RUNNING — unauthorized (fix CRON_SECRET)");
    return fail("Unauthorized.", 401);
  }

  try {
    const summary = await runAppointmentReminderCron();
    return ok({ summary });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[cron/appointment-reminder] ✗ error:", err?.message || err);
    const message =
      process.env.NODE_ENV === "development"
        ? `Cron job failed: ${err?.message || "unknown error"}`
        : "Cron job failed.";
    return fail(message, 500);
  }
}
