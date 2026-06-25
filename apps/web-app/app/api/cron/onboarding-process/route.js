// app/api/cron/onboarding-process/route.js
//
// Cron (every minute): send onboarding-process email when
// status !== onboarded and signup age > 5 minutes (email/password only).

import { fail, ok } from "@/lib/api";
import { runOnboardingProcessReminderCron } from "@/services/emails/runOnboardingProcessReminderCron";

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
  console.log("\n[cron/onboarding-process] ▶ HTTP request received at", new Date().toISOString());

  if (!authorizeCron(request)) {
    // eslint-disable-next-line no-console
    console.warn("[cron/onboarding-process] ✗ NOT RUNNING — unauthorized (fix CRON_SECRET)");
    return fail("Unauthorized.", 401);
  }

  // eslint-disable-next-line no-console
  console.log("[cron/onboarding-process] ✓ authorized — starting patient check…");

  try {
    const summary = await runOnboardingProcessReminderCron();
    return ok({ summary });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[cron/onboarding-process] ✗ error:", err?.message || err);
    const message =
      process.env.NODE_ENV === "development"
        ? `Cron job failed: ${err?.message || "unknown error"}`
        : "Cron job failed.";
    return fail(message, 500);
  }
}
