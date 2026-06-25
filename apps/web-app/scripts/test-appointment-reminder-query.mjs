#!/usr/bin/env node
// Diagnose appointment reminder cron: list scheduled appointments and timing.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

function loadDotenv(filepath) {
  if (!fs.existsSync(filepath)) return;
  for (const line of fs.readFileSync(filepath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    process.env[key] = val.replace(/\\n/g, "\n");
  }
}

loadDotenv(path.join(projectRoot, ".env.local"));

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

if (!projectId || !clientEmail || !privateKey) {
  console.error("Missing FIREBASE_ADMIN_* in .env.local");
  process.exit(1);
}

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, "\n"),
    }),
  });
}

const db = getFirestore();
const REMINDER_BEFORE_MS = 2 * 60 * 1000;
const REMINDER_WINDOW_MS = 30 * 1000;
const minMs = REMINDER_BEFORE_MS - REMINDER_WINDOW_MS;
const maxMs = REMINDER_BEFORE_MS + REMINDER_WINDOW_MS;

function zonedWallTimeToInstant(date, time, tz) {
  if (!date || !time) return null;
  const [y, m, d] = String(date).split("-").map(Number);
  const [hh, mm] = String(time).split(":").map(Number);
  if (!y || !m || !d || Number.isNaN(hh) || Number.isNaN(mm)) return null;
  const guess = Date.UTC(y, m - 1, d, hh, mm, 0);
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz || "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  for (let offsetMin = -16 * 60; offsetMin <= 16 * 60; offsetMin += 15) {
    const probe = guess + offsetMin * 60 * 1000;
    const parts = Object.fromEntries(
      fmt.formatToParts(new Date(probe)).map((p) => [p.type, p.value]),
    );
    const py = Number(parts.year);
    const pm = Number(parts.month);
    const pd = Number(parts.day);
    const ph = Number(parts.hour === "24" ? "0" : parts.hour);
    const pmin = Number(parts.minute);
    if (py === y && pm === m && pd === d && ph === hh && pmin === mm) {
      return probe;
    }
  }
  return null;
}

const now = Date.now();
console.log("Now (local):", new Date().toLocaleString());
console.log("Now (UTC):  ", new Date().toISOString());
console.log(
  "Reminder window: starts in",
  minMs / 1000,
  "to",
  maxMs / 1000,
  "seconds\n",
);

const snap = await db.collection("appointments").where("status", "==", "scheduled").limit(50).get();
console.log("Scheduled appointments found:", snap.size, "\n");

if (snap.empty) {
  console.log("No scheduled appointments in Firestore.");
  process.exit(0);
}

for (const doc of snap.docs) {
  const a = doc.data();
  const tz = a.doctorTimezone || "America/New_York";
  const instant = zonedWallTimeToInstant(a.date, a.time, tz);
  const untilMs = instant == null ? null : instant - now;
  const untilSec = untilMs == null ? null : Math.round(untilMs / 1000);
  const due =
    untilMs != null &&
    !a.appointmentReminderEmailSentAt &&
    untilMs >= minMs &&
    untilMs <= maxMs;

  console.log("---", doc.id);
  console.log("  patient:", a.patientEmail || "(no email)", "|", a.patientName);
  console.log("  doctor:", a.doctorName, "| tz:", tz);
  console.log("  when:", a.date, a.time);
  console.log(
    "  starts:",
    instant ? new Date(instant).toLocaleString("en-US", { timeZone: tz }) : "INVALID DATE/TIME",
    `(${tz})`,
  );
  console.log(
    "  until start:",
    untilSec == null ? "?" : `${untilSec}s (${(untilSec / 60).toFixed(1)} min)`,
  );
  console.log("  reminder already sent:", Boolean(a.appointmentReminderEmailSentAt));
  console.log("  DUE NOW (2-min window):", due ? "YES ✓" : "no");
  console.log("");
}

console.log("=== Recent appointments (any status) ===\n");
const recent = await db.collection("appointments").orderBy("createdAt", "desc").limit(10).get();
for (const doc of recent.docs) {
  const a = doc.data();
  console.log(
    doc.id,
    "|",
    a.status,
    "|",
    a.date,
    a.time,
    "|",
    a.patientEmail,
    "| reminder:",
    a.appointmentReminderEmailSentAt ? "SENT" : "not-sent",
  );
}

console.log("\n=== Recent reminder email logs ===\n");
const logs = await db
  .collection("notificationEmailLogs")
  .where("category", "==", "patient_appointment_reminder")
  .orderBy("createdAt", "desc")
  .limit(5)
  .get()
  .catch(async () => {
    const fallback = await db.collection("notificationEmailLogs").limit(20).get();
    return {
      docs: fallback.docs.filter((d) => d.data().category === "patient_appointment_reminder"),
    };
  });

if (!logs.docs?.length) {
  console.log("No patient_appointment_reminder emails logged yet.");
} else {
  for (const doc of logs.docs) {
    const l = doc.data();
    console.log(l.createdAt?.toDate?.() || l.createdAt, "|", l.status, "|", l.toEmail, "|", l.subject);
  }
}
