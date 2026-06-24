#!/usr/bin/env node
//
// scripts/seed-admin.mjs
//
// Bootstrap an admin or superadmin account. Admins/superadmins are NEVER
// created via the public signup flow — they must be seeded out-of-band
// with this script (or directly in the Firebase console).
//
// Usage (from apps/web-app):
//   node scripts/seed-admin.mjs --email=ops@medclap.com --role=admin --org=medclap1
//   node scripts/seed-admin.mjs --email=deep@medclap.com --role=superadmin --password='SuperAdmin@123'
//   node scripts/seed-admin.mjs --email=ops@ongo.com --role=admin           # defaults org to "ongo"
//
// Behavior:
//   1. Reads .env.local for FIREBASE_ADMIN_PROJECT_ID, _CLIENT_EMAIL, _PRIVATE_KEY.
//   2. Looks up the Firebase Auth user by email. If missing and --password is
//      supplied, creates the Auth user automatically. Otherwise prints instructions
//      to create the user in Firebase Console first.
//   3. Writes users/{uid} with role + orgSlug (or upgrades an existing doc).
//   4. Idempotent — safe to run repeatedly with the same input.
//
// Self-contained: this script initializes its own Firebase Admin SDK rather
// than importing from lib/firebase/admin.js (which uses path aliases and
// is wired for the Next.js bundler).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

/* ─── Load env vars from .env.local (tiny parser, no dotenv dep) ───── */

function loadDotenv(filepath, { override = false } = {}) {
  if (!fs.existsSync(filepath)) return;
  const lines = fs.readFileSync(filepath, "utf8").split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    // Strip surrounding quotes if present.
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (override || !(key in process.env)) process.env[key] = val;
  }
}

loadDotenv(path.join(projectRoot, ".env"));
loadDotenv(path.join(projectRoot, ".env.local"), { override: true });

/* ─── Firebase Admin SDK init ─────────────────────────────────────── */

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
    console.error(
      `[seed-admin] Missing required env vars in .env.local: ${missing.join(", ")}`,
    );
    console.error(
      "Find these in Firebase Console → Project Settings → Service accounts.",
    );
    process.exit(1);
  }

  initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

/* ─── Arg parsing ─────────────────────────────────────────────────── */

function parseArgs(argv) {
  const out = {};
  for (const arg of argv.slice(2)) {
    const m = arg.match(/^--([^=]+)=(.*)$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

function usage() {
  console.error("Usage:");
  console.error(
    "  node scripts/seed-admin.mjs --email=<address> --role=admin --org=<slug>",
  );
  console.error(
    "  node scripts/seed-admin.mjs --email=<address> --role=superadmin [--password=<pass>]",
  );
  console.error("");
  console.error("  --password  Optional. Creates the Auth user when missing, or");
  console.error("              resets the password when the user already exists.");
}

/* ─── Main ────────────────────────────────────────────────────────── */

async function main() {
  const args = parseArgs(process.argv);
  const email = (args.email || "").trim().toLowerCase();
  const role = (args.role || "admin").trim();
  const orgSlug = (args.org || "ongo").trim().toLowerCase();
  const password = typeof args.password === "string" ? args.password : "";

  if (!email) {
    console.error("Missing --email=<address>");
    usage();
    process.exit(1);
  }
  if (!["admin", "superadmin"].includes(role)) {
    console.error('--role must be "admin" or "superadmin"');
    usage();
    process.exit(1);
  }

  initAdmin();
  const adminAuth = getAuth();
  const adminDb = getFirestore();

  let authUser = await adminAuth.getUserByEmail(email).catch(() => null);
  if (!authUser) {
    if (!password) {
      console.error(
        `[seed-admin] No Firebase Auth user with email ${email}.\n` +
          `Either create the user in Firebase Console (Authentication → Add user),\n` +
          `or re-run with --password=<pass> to create the Auth user automatically.`,
      );
      process.exit(1);
    }
    if (password.length < 8) {
      console.error("[seed-admin] --password must be at least 8 characters.");
      process.exit(1);
    }
    authUser = await adminAuth.createUser({
      email,
      password,
      emailVerified: false,
    });
    console.log(`✓ Created Firebase Auth user ${email} (uid=${authUser.uid})`);
  } else if (password) {
    if (password.length < 8) {
      console.error("[seed-admin] --password must be at least 8 characters.");
      process.exit(1);
    }
    await adminAuth.updateUser(authUser.uid, { password });
    console.log(`✓ Updated Firebase Auth password for ${email}`);
  }

  const ref = adminDb.collection("users").doc(authUser.uid);
  const snap = await ref.get();
  const now = FieldValue.serverTimestamp();
  const resolvedOrg = role === "superadmin" ? null : orgSlug;

  if (!snap.exists) {
    await ref.set({
      role,
      orgSlug: resolvedOrg,
      email: authUser.email,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
    console.log(
      `✓ Created users/${authUser.uid} (role=${role}, org=${resolvedOrg ?? "—"})`,
    );
    return;
  }

  // For existing docs, force role + orgSlug to the requested values.
  // This is the one place where mutating either field is allowed —
  // explicit out-of-band override by an operator.
  await ref.update({
    role,
    orgSlug: resolvedOrg,
    email: authUser.email,
    updatedAt: now,
  });
  console.log(
    `✓ Updated users/${authUser.uid} (role=${role}, org=${resolvedOrg ?? "—"})`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("seed-admin failed:", err);
    process.exit(1);
  });
