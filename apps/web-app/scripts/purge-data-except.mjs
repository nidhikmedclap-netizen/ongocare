#!/usr/bin/env node
//
// Delete user-linked Firestore data EXCEPT a keep-list of emails.
// Does NOT touch contacts, conversations, communications, calls, or email logs.
//
// Usage (from apps/web-app):
//   node scripts/purge-data-except.mjs --dry-run
//   node scripts/purge-data-except.mjs --confirm=YES-PURGE
//   node scripts/purge-data-except.mjs --keep=a@x.com,b@x.com --dry-run
//
// ALWAYS run --dry-run first and verify the summary before confirming.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const DEFAULT_KEEP_EMAILS = [
  "deep@medclap.com",
  "admin@medclap.com",
  "admin3@medclap.com",
  "admin2@medclap.com",
  "admin1@medclap.com",
];

function loadDotenv(filepath, { override = false } = {}) {
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
    if (override || !(key in process.env)) {
      process.env[key] = val.replace(/\\n/g, "\n");
    }
  }
}

loadDotenv(path.join(projectRoot, ".env"));
loadDotenv(path.join(projectRoot, ".env.local"), { override: true });

function parseArgs(argv) {
  const out = { dryRun: false };
  for (const arg of argv.slice(2)) {
    if (arg === "--dry-run") out.dryRun = true;
    else if (arg.startsWith("--keep=")) {
      out.keep = arg
        .slice(7)
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
    } else if (arg.startsWith("--confirm=")) {
      out.confirm = arg.slice(10);
    }
  }
  return out;
}

function initAdmin() {
  if (getApps().length) return;

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || "").replace(
    /\\n/g,
    "\n",
  );

  const missing = [];
  if (!projectId) missing.push("FIREBASE_ADMIN_PROJECT_ID");
  if (!clientEmail) missing.push("FIREBASE_ADMIN_CLIENT_EMAIL");
  if (!privateKey) missing.push("FIREBASE_ADMIN_PRIVATE_KEY");
  if (missing.length) {
    console.error(`Missing env vars in .env.local: ${missing.join(", ")}`);
    process.exit(1);
  }

  initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

async function listAllAuthUsers(auth) {
  const users = [];
  let pageToken;
  do {
    const page = await auth.listUsers(1000, pageToken);
    users.push(...page.users);
    pageToken = page.pageToken;
  } while (pageToken);
  return users;
}

function isKeptUid(uid, keepUids) {
  return keepUids.has(uid);
}

async function commitBatch(batch, pending, dryRun) {
  if (pending === 0) return 0;
  if (!dryRun) await batch.commit();
  return pending;
}

async function deleteDocs(docs, db, dryRun, label, stats) {
  let batch = db.batch();
  let pending = 0;
  let total = 0;

  for (const doc of docs) {
    batch.delete(doc.ref);
    pending += 1;
    total += 1;
    if (pending >= 400) {
      await commitBatch(batch, pending, dryRun);
      batch = db.batch();
      pending = 0;
    }
  }
  await commitBatch(batch, pending, dryRun);
  stats[label] = (stats[label] || 0) + total;
  return total;
}

async function purgeCollection(db, collectionName, shouldDelete, dryRun, stats) {
  const snap = await db.collection(collectionName).get();
  const toDelete = snap.docs.filter(shouldDelete);
  if (toDelete.length) {
    await deleteDocs(toDelete, db, dryRun, collectionName, stats);
  }
}

async function main() {
  const args = parseArgs(process.argv);
  const keepEmails = (args.keep || DEFAULT_KEEP_EMAILS).map((e) =>
    e.toLowerCase(),
  );
  const dryRun = args.dryRun || args.confirm !== "YES-PURGE";

  if (!args.dryRun && args.confirm !== "YES-PURGE") {
    console.error("Refusing to run without --dry-run or --confirm=YES-PURGE");
    process.exit(1);
  }

  initAdmin();
  const auth = getAuth();
  const db = getFirestore();

  console.log(`Project: ${process.env.FIREBASE_ADMIN_PROJECT_ID}`);
  console.log(`Mode: ${dryRun ? "DRY RUN (no writes)" : "LIVE DELETE"}`);
  console.log(`Keep emails (${keepEmails.length}):`);
  keepEmails.forEach((e) => console.log(`  - ${e}`));

  const authUsers = await listAllAuthUsers(auth);
  const keepUids = new Set();
  const missingEmails = [];

  for (const email of keepEmails) {
    const user = authUsers.find(
      (u) => (u.email || "").toLowerCase() === email,
    );
    if (!user) {
      missingEmails.push(email);
    } else {
      keepUids.add(user.uid);
    }
  }

  if (missingEmails.length) {
    console.error("\nThese keep emails were NOT found in Firebase Auth:");
    missingEmails.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }

  console.log("\nKeep UIDs:");
  for (const user of authUsers) {
    if (keepUids.has(user.uid)) {
      console.log(`  ${user.email} → ${user.uid}`);
    }
  }

  const firestoreUsers = await db.collection("users").get();
  const firestoreDeleteUids = firestoreUsers.docs
    .map((d) => d.id)
    .filter((uid) => !keepUids.has(uid));

  const stats = {};

  // ── Firestore: user-linked collections only ────────────────────────
  await purgeCollection(
    db,
    "users",
    (doc) => !isKeptUid(doc.id, keepUids),
    dryRun,
    stats,
  );

  await purgeCollection(db, "appointments", () => true, dryRun, stats);

  // Wipe all doctor/patient scheduling and payment data (not scoped to keep-list).
  await purgeCollection(db, "availability", () => true, dryRun, stats);
  await purgeCollection(db, "doctorPayoutAccounts", () => true, dryRun, stats);
  await purgeCollection(db, "doctorPatientEarnings", () => true, dryRun, stats);
  await purgeCollection(db, "planPayments", () => true, dryRun, stats);
  await purgeCollection(db, "appointmentSlotLocks", () => true, dryRun, stats);

  const authDeleteUids = authUsers
    .map((u) => u.uid)
    .filter((uid) => !keepUids.has(uid));

  console.log("\n── Summary ──");
  console.log(`Firestore users to delete: ${firestoreDeleteUids.length}`);
  console.log(`Firebase Auth users to delete: ${authDeleteUids.length}`);
  console.log("Skipped: contacts, conversations, communications, calls, notificationEmailLogs");
  console.log("Collection deletes:");
  for (const [key, count] of Object.entries(stats).sort()) {
    if (count > 0) console.log(`  ${key}: ${count}`);
  }

  if (dryRun) {
    console.log(
      "\nDry run complete. Re-run with --confirm=YES-PURGE to apply.",
    );
    return;
  }

  console.log("\nDeleting Firebase Auth accounts…");
  let authDeleted = 0;
  let authFailed = 0;
  for (const uid of authDeleteUids) {
    try {
      await auth.deleteUser(uid);
      authDeleted += 1;
    } catch (err) {
      authFailed += 1;
      console.warn(`  Failed to delete Auth user ${uid}: ${err?.message || err}`);
    }
  }
  console.log(`Auth deleted: ${authDeleted}, failed: ${authFailed}`);
  console.log("\nPurge complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
