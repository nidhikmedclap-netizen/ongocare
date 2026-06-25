#!/usr/bin/env node
// One-off: diagnose Firestore query used by onboarding cron.

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

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

if (!projectId || !clientEmail || !privateKey) {
  console.error("Missing FIREBASE_ADMIN_* in .env.local");
  process.exit(1);
}

if (!getApps().length) {
  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey: privateKey.replace(/\\n/g, "\n") }),
  });
}

const db = getFirestore();
const REMINDER_MS = 5 * 60 * 1000;
const cutoff = Timestamp.fromMillis(Date.now() - REMINDER_MS);

try {
  console.log("Running cron Firestore query (createdAt only)…");
  const snap = await db
    .collection("users")
    .where("createdAt", "<=", cutoff)
    .limit(5)
    .get();
  console.log("OK — docs returned:", snap.size);
} catch (err) {
  console.error("QUERY FAILED:");
  console.error(err?.message || err);
  if (String(err?.message || "").includes("index")) {
    console.error("\nFix: firebase deploy --only firestore:indexes");
  }
  process.exit(1);
}
