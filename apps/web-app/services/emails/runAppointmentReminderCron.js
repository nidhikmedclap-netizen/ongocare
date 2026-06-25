// services/emails/runAppointmentReminderCron.js
//
// Every-minute cron: send appointment reminder ~2 minutes before start.

import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import {
  appointmentInstantMs,
  isoDateInTimezone,
} from "@/lib/time/timezone";
import {
  APPOINTMENT_REMINDER_BEFORE_MINUTES,
  APPOINTMENT_REMINDER_BEFORE_MS,
  APPOINTMENT_REMINDER_WINDOW_MS,
} from "@/services/emails/appointmentReminderConfig";
import { sendPatientAppointmentReminderEmail } from "@/services/emails/sendPatientAppointmentReminderEmail";

if (typeof window !== "undefined") {
  throw new Error("[email/runAppointmentReminderCron] Server-only.");
}

export { APPOINTMENT_REMINDER_BEFORE_MINUTES };

const BATCH_LIMIT = 300;

const SCAN_TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "UTC",
];

function candidateDatesForScan() {
  const now = Date.now();
  const dates = new Set();
  for (const tz of SCAN_TIMEZONES) {
    for (const offsetDays of [-1, 0, 1]) {
      const key = isoDateInTimezone(now + offsetDays * 86_400_000, tz);
      if (key) dates.add(key);
    }
  }
  return [...dates].slice(0, 10);
}

function appointmentStartMs(appointment) {
  if (typeof appointment?.appointmentStartAt?.toMillis === "function") {
    return appointment.appointmentStartAt.toMillis();
  }
  return appointmentInstantMs(
    appointment.date,
    appointment.time,
    appointment.doctorTimezone,
  );
}

function reminderDueAtMs(appointment) {
  if (typeof appointment?.reminderDueAt?.toMillis === "function") {
    return appointment.reminderDueAt.toMillis();
  }
  const startMs = appointmentStartMs(appointment);
  if (startMs == null) return null;
  return startMs - APPOINTMENT_REMINDER_BEFORE_MS;
}

function msUntilStart(appointment) {
  const instant = appointmentStartMs(appointment);
  if (instant == null) return null;
  return instant - Date.now();
}

function isDueForReminder(appointment, nowMs = Date.now()) {
  if (appointment.status !== "scheduled") return false;
  if (appointment.appointmentReminderEmailSentAt) return false;

  const startMs = appointmentStartMs(appointment);
  if (startMs != null && startMs <= nowMs) return false;

  const dueMs = reminderDueAtMs(appointment);
  if (dueMs != null) {
    return dueMs <= nowMs;
  }

  const until = msUntilStart(appointment);
  if (until == null) return false;
  const minMs = APPOINTMENT_REMINDER_BEFORE_MS - APPOINTMENT_REMINDER_WINDOW_MS;
  const maxMs = APPOINTMENT_REMINDER_BEFORE_MS + APPOINTMENT_REMINDER_WINDOW_MS;
  return until >= minMs && until <= maxMs;
}

async function fetchScheduledAppointments() {
  const base = adminDb.collection("appointments");
  const now = Timestamp.now();

  try {
    const snap = await base
      .where("status", "==", "scheduled")
      .where("reminderDueAt", "<=", now)
      .limit(BATCH_LIMIT)
      .get();
    return { snap, mode: "reminderDueAt-query" };
  } catch (err) {
    const msg = String(err?.message || "");
    if (!msg.includes("FAILED_PRECONDITION") && !msg.includes("requires an index")) {
      throw err;
    }
    // eslint-disable-next-line no-console
    console.warn(
      "[cron/appointment-reminder] index missing for status+reminderDueAt — using date fallback",
    );
  }

  const dates = candidateDatesForScan();
  if (dates.length > 0) {
    try {
      const snap = await base
        .where("status", "==", "scheduled")
        .where("date", "in", dates)
        .limit(BATCH_LIMIT)
        .get();
      return { snap, mode: "status-date-fallback" };
    } catch (err) {
      const msg = String(err?.message || "");
      if (!msg.includes("FAILED_PRECONDITION") && !msg.includes("requires an index")) {
        throw err;
      }
      // eslint-disable-next-line no-console
      console.warn(
        "[cron/appointment-reminder] index missing for status+date — using status-only fallback",
      );
    }
  }

  const snap = await base
    .where("status", "==", "scheduled")
    .limit(BATCH_LIMIT)
    .get();
  return { snap, mode: "status-fallback" };
}

/**
 * @returns {Promise<{ scanned: number, eligible: number, sent: number, skipped: number, failed: number, details: object[] }>}
 */
export async function runAppointmentReminderCron() {
  const nowIso = new Date().toISOString();

  // eslint-disable-next-line no-console
  console.log("────────────────────────────────────────────────────────");
  // eslint-disable-next-line no-console
  console.log("[cron/appointment-reminder] RUNNING at", nowIso);
  // eslint-disable-next-line no-console
  console.log(
    "[cron/appointment-reminder] rule: scheduled, reminder due (2 min before start), not started yet",
  );

  const { snap, mode } = await fetchScheduledAppointments();

  // eslint-disable-next-line no-console
  console.log(
    "[cron/appointment-reminder] Firestore returned",
    snap.size,
    "appointment(s)",
    `(${mode})`,
  );

  const summary = {
    scanned: snap.size,
    eligible: 0,
    sent: 0,
    skipped: 0,
    failed: 0,
    details: [],
  };

  for (const doc of snap.docs) {
    const appointment = { id: doc.id, ...doc.data() };
    const untilMs = msUntilStart(appointment);
    const untilMin = untilMs == null ? null : Math.round(untilMs / 60_000);

    if (!isDueForReminder(appointment)) {
      summary.skipped += 1;
      if (appointment.status === "scheduled" && untilMin != null && untilMin <= 10) {
        // eslint-disable-next-line no-console
        console.log("[cron/appointment-reminder] skip", {
          appointmentId: doc.id,
          patientUid: appointment.patientUid,
          startsInMinutes: untilMin,
          reason: appointment.appointmentReminderEmailSentAt
            ? "already-sent"
            : untilMs != null && untilMs <= 0
              ? "already-started"
              : "not-due-yet",
        });
      }
      continue;
    }

    summary.eligible += 1;
    // eslint-disable-next-line no-console
    console.log("[cron/appointment-reminder] eligible — sending email", {
      appointmentId: doc.id,
      patientUid: appointment.patientUid,
      doctorName: appointment.doctorName,
      startsInMinutes: untilMin,
      date: appointment.date,
      time: appointment.time,
    });

    try {
      const result = await sendPatientAppointmentReminderEmail({
        uid: appointment.patientUid,
        appointment,
      });

      if (result.ok) {
        summary.sent += 1;
        summary.details.push({ appointmentId: doc.id, status: "sent" });
        // eslint-disable-next-line no-console
        console.log("[cron/appointment-reminder] email sent OK", {
          appointmentId: doc.id,
        });
      } else if (result.skipped) {
        summary.skipped += 1;
        summary.details.push({
          appointmentId: doc.id,
          status: "skipped",
          reason: result.reason,
        });
      } else {
        summary.failed += 1;
        summary.details.push({
          appointmentId: doc.id,
          status: "failed",
          reason: result.reason,
        });
      }
    } catch (err) {
      summary.failed += 1;
      summary.details.push({
        appointmentId: doc.id,
        status: "failed",
        reason: err?.message || "unexpected-error",
      });
      // eslint-disable-next-line no-console
      console.error("[cron/appointment-reminder] send error", doc.id, err);
    }
  }

  // eslint-disable-next-line no-console
  console.log("[cron/appointment-reminder] FINISHED", {
    scanned: summary.scanned,
    eligible: summary.eligible,
    sent: summary.sent,
    skipped: summary.skipped,
    failed: summary.failed,
  });
  // eslint-disable-next-line no-console
  console.log("────────────────────────────────────────────────────────");

  return summary;
}
