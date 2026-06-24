#!/usr/bin/env node
/**
 * Backfill orgSlug on conversations, communications, and calls
 * using orgPhoneNumbers/{e164} and businessLineE164.
 *
 * Usage:
 *   node scripts/backfillOrgSlug.js
 *   node scripts/backfillOrgSlug.js --dry-run
 */
require("dotenv").config();

const { FieldValue } = require("firebase-admin/firestore");
const { initFirebaseAdmin, getFirestore } = require("../lib/firebase");
const { normalizeE164 } = require("../lib/phoneE164");
const OrgPhoneNumberRepository = require("../repositories/OrgPhoneNumberRepository");

async function loadLineToOrgMap() {
  const repo = new OrgPhoneNumberRepository();
  const rows = await repo.listAll();
  const map = new Map();
  for (const row of rows) {
    const e164 = normalizeE164(row.e164);
    if (e164 && row.orgSlug) {
      map.set(e164, row.orgSlug);
    }
  }
  return map;
}

function resolveOrgSlug(lineToOrg, businessLineE164) {
  const e164 = normalizeE164(businessLineE164);
  if (!e164) return null;
  return lineToOrg.get(e164) || null;
}

async function backfillCollection({
  db,
  collectionName,
  lineToOrg,
  dryRun,
  getLine,
  getExistingOrgSlug,
}) {
  const snap = await db.collection(collectionName).get();
  let examined = 0;
  let updated = 0;
  let skipped = 0;
  let unresolved = 0;

  for (const doc of snap.docs) {
    examined += 1;
    const data = doc.data();
    const existingOrgSlug = getExistingOrgSlug(data);
    if (existingOrgSlug) {
      skipped += 1;
      continue;
    }

    const businessLineE164 = getLine(data, doc.id);
    const orgSlug = resolveOrgSlug(lineToOrg, businessLineE164);
    if (!orgSlug) {
      unresolved += 1;
      continue;
    }

    updated += 1;
    if (dryRun) {
      console.log(`[dry-run] ${collectionName}/${doc.id} -> orgSlug=${orgSlug}`);
      continue;
    }

    await doc.ref.set(
      {
        orgSlug,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  }

  return { examined, updated, skipped, unresolved };
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  initFirebaseAdmin();
  const db = getFirestore();
  const lineToOrg = await loadLineToOrgMap();

  if (!lineToOrg.size) {
    console.error("[backfill] orgPhoneNumbers is empty. Run seedOrganizationFoundation.js first.");
    process.exit(1);
  }

  console.log(`[backfill] loaded ${lineToOrg.size} phone mappings${dryRun ? " (dry-run)" : ""}`);

  const conversationStats = await backfillCollection({
    db,
    collectionName: "conversations",
    lineToOrg,
    dryRun,
    getLine: (data) => data.businessLineE164,
    getExistingOrgSlug: (data) => data.orgSlug || null,
  });
  console.log("[backfill] conversations", conversationStats);

  const conversationOrgById = new Map();
  const conversationSnap = await db.collection("conversations").get();
  for (const doc of conversationSnap.docs) {
    if (doc.data().orgSlug) {
      conversationOrgById.set(doc.id, doc.data().orgSlug);
    }
  }

  const communicationStats = await backfillCollection({
    db,
    collectionName: "communications",
    lineToOrg,
    dryRun,
    getLine: (data) => data.metadata?.businessLineE164,
    getExistingOrgSlug: (data) => data.orgSlug || null,
  });
  console.log("[backfill] communications (by metadata line)", communicationStats);

  let commByConversation = 0;
  for (const doc of (await db.collection("communications").get()).docs) {
    if (doc.data().orgSlug) continue;
    const orgSlug = conversationOrgById.get(doc.data().conversationId);
    if (!orgSlug) continue;
    commByConversation += 1;
    if (!dryRun) {
      await doc.ref.set(
        { orgSlug, updatedAt: FieldValue.serverTimestamp() },
        { merge: true },
      );
    }
  }
  console.log("[backfill] communications (by conversationId)", { updated: commByConversation });

  const callStats = await backfillCollection({
    db,
    collectionName: "calls",
    lineToOrg,
    dryRun,
    getLine: (data) => data.businessLineE164,
    getExistingOrgSlug: (data) => data.orgSlug || null,
  });
  console.log("[backfill] calls", callStats);

  console.log("[backfill] done");
}

main().catch((error) => {
  console.error("[backfill] failed:", error.message || error);
  process.exit(1);
});
