#!/usr/bin/env node
// Backfill appointmentStartAt + reminderDueAt on existing scheduled appointments.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

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

const REMINDER_MS = 2 * 60 * 1000;

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
const snap = await db.collection("appointments").where("status", "==", "scheduled").get();

let updated = 0;
let skipped = 0;

for (const doc of snap.docs) {
  const a = doc.data();
  if (a.reminderDueAt && a.appointmentStartAt) {
    skipped += 1;
    continue;
  }
  const startMs = zonedWallTimeToInstant(a.date, a.time, a.doctorTimezone || "America/New_York");
  if (startMs == null) {
    console.warn("skip invalid date/time", doc.id, a.date, a.time);
    skipped += 1;
    continue;
  }
  await doc.ref.set(
    {
      appointmentStartAt: Timestamp.fromMillis(startMs),
      reminderDueAt: Timestamp.fromMillis(startMs - REMINDER_MS),
    },
    { merge: true },
  );
  updated += 1;
  console.log("updated", doc.id, a.date, a.time);
}

console.log("\nDone.", { updated, skipped, total: snap.size });
