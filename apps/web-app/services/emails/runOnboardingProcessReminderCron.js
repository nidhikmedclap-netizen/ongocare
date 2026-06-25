// services/emails/runOnboardingProcessReminderCron.js
//
// Every-minute cron: email/password patients with status !== onboarded
// and signup age >= 5 minutes.

import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import {
  ONBOARDING_PROCESS_REMINDER_MINUTES,
  sendPatientOnboardingProcessEmail,
} from "@/services/emails/sendPatientOnboardingProcessEmail";

if (typeof window !== "undefined") {
  throw new Error("[email/runOnboardingProcessReminderCron] Server-only.");
}

const BATCH_LIMIT = 200;
const REMINDER_MS = ONBOARDING_PROCESS_REMINDER_MINUTES * 60 * 1000;

function signupAgeMinutes(profile) {
  const createdMs =
    typeof profile?.createdAt?.toMillis === "function"
      ? profile.createdAt.toMillis()
      : null;
  if (!createdMs) return null;
  return Math.floor((Date.now() - createdMs) / (60 * 1000));
}

/** Missing role defaults to patient (legacy docs). */
export function isPatientRole(profile) {
  const role = String(profile?.role || "patient").trim().toLowerCase();
  return role === "patient";
}

function alreadySentOnboardingProcessEmail(profile) {
  return Boolean(
    profile?.onboardingProcessEmailSentAt || profile?.onboardingProcess74hEmailSentAt,
  );
}

function skipReason(profile) {
  if (!profile || typeof profile !== "object") return "invalid-profile";
  if (!isPatientRole(profile)) return "not-patient";
  if (profile.status === "onboarded") return "already-onboarded";
  if (profile.authProvider === "google") return "google-signup";
  if (alreadySentOnboardingProcessEmail(profile)) return "already-sent";
  const email = String(profile.email || "").trim();
  if (!email.includes("@")) return "missing-email";
  const ageMin = signupAgeMinutes(profile);
  if (ageMin == null) return "missing-createdAt";
  if (ageMin < ONBOARDING_PROCESS_REMINDER_MINUTES) {
    return `signup-too-recent (${ageMin}m < ${ONBOARDING_PROCESS_REMINDER_MINUTES}m)`;
  }
  return null;
}

async function fetchPatientsSignedUpBefore(cutoff) {
  const base = adminDb.collection("users");
  try {
    const snap = await base
      .where("role", "==", "patient")
      .where("createdAt", "<=", cutoff)
      .limit(BATCH_LIMIT)
      .get();
    return { snap, mode: "patient-query" };
  } catch (err) {
    const msg = String(err?.message || "");
    if (!msg.includes("FAILED_PRECONDITION") && !msg.includes("requires an index")) {
      throw err;
    }
    // eslint-disable-next-line no-console
    console.warn(
      "[cron/onboarding-process] Firestore index missing for role+createdAt — using fallback query.",
      "Create index: firebase deploy --only firestore:indexes",
    );
    const snap = await base
      .where("createdAt", "<=", cutoff)
      .limit(BATCH_LIMIT)
      .get();
    return { snap, mode: "createdAt-fallback" };
  }
}

/**
 * @returns {Promise<{ scanned: number, eligible: number, sent: number, skipped: number, failed: number, details: object[] }>}
 */
export async function runOnboardingProcessReminderCron() {
  const nowIso = new Date().toISOString();
  const cutoff = Timestamp.fromMillis(Date.now() - REMINDER_MS);
  const cutoffIso = new Date(Date.now() - REMINDER_MS).toISOString();

  // eslint-disable-next-line no-console
  console.log("────────────────────────────────────────────────────────");
  // eslint-disable-next-line no-console
  console.log("[cron/onboarding-process] RUNNING at", nowIso);
  // eslint-disable-next-line no-console
  console.log(
    "[cron/onboarding-process] rule: role=patient, signup age >",
    ONBOARDING_PROCESS_REMINDER_MINUTES,
    "minutes, status !== onboarded, email/password only",
  );
  // eslint-disable-next-line no-console
  console.log("[cron/onboarding-process] checking patients with createdAt before", cutoffIso);

  const { snap, mode } = await fetchPatientsSignedUpBefore(cutoff);

  // eslint-disable-next-line no-console
  console.log(
    "[cron/onboarding-process] Firestore returned",
    snap.size,
    mode === "patient-query" ? "patient(s)" : "user(s) — filtering to patients in memory",
  );

  const summary = {
    scanned: 0,
    eligible: 0,
    sent: 0,
    skipped: 0,
    failed: 0,
    details: [],
  };

  let skippedNonPatient = 0;

  for (const doc of snap.docs) {
    const profile = doc.data() || {};

    if (!isPatientRole(profile)) {
      if (mode === "createdAt-fallback") {
        skippedNonPatient += 1;
        summary.skipped += 1;
      }
      continue;
    }

    summary.scanned += 1;
    const ageMin = signupAgeMinutes(profile);
    const reason = skipReason(profile);

    if (reason) {
      summary.skipped += 1;
      // eslint-disable-next-line no-console
      console.log("[cron/onboarding-process] skip patient", {
        uid: doc.id,
        email: profile.email || "(none)",
        status: profile.status || "(none)",
        role: profile.role || "patient",
        signupAgeMinutes: ageMin,
        reason,
      });
      continue;
    }

    summary.eligible += 1;
    // eslint-disable-next-line no-console
    console.log("[cron/onboarding-process] eligible — sending email", {
      uid: doc.id,
      email: profile.email,
      status: profile.status || "incomplete",
      role: profile.role || "patient",
      signupAgeMinutes: ageMin,
    });

    try {
      const result = await sendPatientOnboardingProcessEmail({
        uid: doc.id,
        profile,
      });

      if (result.ok) {
        summary.sent += 1;
        summary.details.push({ uid: doc.id, status: "sent" });
        // eslint-disable-next-line no-console
        console.log("[cron/onboarding-process] email sent OK", { uid: doc.id });
      } else if (result.skipped) {
        summary.skipped += 1;
        summary.details.push({ uid: doc.id, status: "skipped", reason: result.reason });
        // eslint-disable-next-line no-console
        console.log("[cron/onboarding-process] send skipped", {
          uid: doc.id,
          reason: result.reason,
        });
      } else {
        summary.failed += 1;
        summary.details.push({ uid: doc.id, status: "failed", reason: result.reason });
        // eslint-disable-next-line no-console
        console.log("[cron/onboarding-process] send FAILED", {
          uid: doc.id,
          reason: result.reason,
        });
      }
    } catch (err) {
      summary.failed += 1;
      summary.details.push({
        uid: doc.id,
        status: "failed",
        reason: err?.message || "unexpected-error",
      });
      // eslint-disable-next-line no-console
      console.error("[cron/onboarding-process] send error", doc.id, err);
    }
  }

  if (skippedNonPatient > 0) {
    // eslint-disable-next-line no-console
    console.log(
      "[cron/onboarding-process] ignored",
      skippedNonPatient,
      "doctor/admin account(s) (not patients). Deploy Firestore index to query patients only.",
    );
  }

  if (summary.scanned === 0) {
    // eslint-disable-next-line no-console
    console.log("[cron/onboarding-process] no patients with signup age >= 5 minutes to check");
  }

  // eslint-disable-next-line no-console
  console.log("[cron/onboarding-process] FINISHED", {
    patientsScanned: summary.scanned,
    eligible: summary.eligible,
    sent: summary.sent,
    skipped: summary.skipped,
    failed: summary.failed,
  });
  // eslint-disable-next-line no-console
  console.log("────────────────────────────────────────────────────────");

  return summary;
}
