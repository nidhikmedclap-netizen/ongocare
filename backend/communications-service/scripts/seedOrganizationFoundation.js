#!/usr/bin/env node
/**
 * Seed organizations/{orgSlug} and orgPhoneNumbers/{e164} from environment.
 *
 * Usage:
 *   node scripts/seedOrganizationFoundation.js
 *
 * Env:
 *   COMMUNICATIONS_DEFAULT_ORG_SLUG=ongo
 *   COMMUNICATIONS_ORG_NAME="Ongo Weight Loss"
 *   ORG_PHONE_MAPPINGS=+15592344795=ongo,+12063383622=ongo
 *   TWILIO_SMS_FROM_NUMBER=+15592344795  (also seeded if not in mappings)
 */
require("dotenv").config();

const { initFirebaseAdmin } = require("../lib/firebase");
const { normalizeE164 } = require("../lib/phoneE164");
const { normalizeOrgSlug } = require("../lib/orgSlug");
const OrganizationRepository = require("../repositories/OrganizationRepository");
const OrgPhoneNumberRepository = require("../repositories/OrgPhoneNumberRepository");

function parseMappings(raw) {
  const mappings = new Map();
  const text = String(raw || "").trim();
  if (!text) return mappings;

  for (const entry of text.split(",")) {
    const trimmed = entry.trim();
    if (!trimmed) continue;
    const [e164Part, orgPart] = trimmed.split("=");
    const e164 = normalizeE164(e164Part);
    const orgSlug = normalizeOrgSlug(orgPart);
    if (!e164 || !orgSlug) {
      console.warn("[seed] skipping invalid mapping entry:", trimmed);
      continue;
    }
    mappings.set(e164, orgSlug);
  }

  return mappings;
}

async function main() {
  initFirebaseAdmin();

  const defaultOrgSlug =
    normalizeOrgSlug(process.env.COMMUNICATIONS_DEFAULT_ORG_SLUG) || "ongo";
  const orgName = (process.env.COMMUNICATIONS_ORG_NAME || "").trim() || defaultOrgSlug;
  const mappings = parseMappings(process.env.ORG_PHONE_MAPPINGS);

  const fromNumber = normalizeE164(process.env.TWILIO_SMS_FROM_NUMBER);
  if (fromNumber && !mappings.has(fromNumber)) {
    mappings.set(fromNumber, defaultOrgSlug);
  }

  if (!mappings.size) {
    console.error(
      "[seed] no phone mappings. Set ORG_PHONE_MAPPINGS and/or TWILIO_SMS_FROM_NUMBER.",
    );
    process.exit(1);
  }

  const orgRepo = new OrganizationRepository();
  const phoneRepo = new OrgPhoneNumberRepository();

  const orgResult = await orgRepo.upsert(defaultOrgSlug, {
    name: orgName,
    product: process.env.COMMUNICATIONS_ORG_PRODUCT || "weight_loss",
    defaultMessagingLineE164: fromNumber || [...mappings.keys()][0],
    status: "active",
  });
  console.log(
    `[seed] organizations/${defaultOrgSlug} ${orgResult.created ? "created" : "updated"}`,
  );

  const orgSlugs = new Set([defaultOrgSlug]);
  for (const orgSlug of mappings.values()) {
    orgSlugs.add(orgSlug);
  }

  for (const orgSlug of orgSlugs) {
    if (orgSlug === defaultOrgSlug) continue;
    const result = await orgRepo.upsert(orgSlug, { status: "active" });
    console.log(`[seed] organizations/${orgSlug} ${result.created ? "created" : "updated"}`);
  }

  let defaultAssigned = false;
  for (const [e164, orgSlug] of mappings.entries()) {
    const isDefault = !defaultAssigned && e164 === fromNumber;
    if (isDefault) defaultAssigned = true;

    const result = await phoneRepo.upsert(e164, {
      orgSlug,
      channel: "sms_voice",
      isDefault,
      label: isDefault ? "default" : null,
      status: "active",
    });
    console.log(
      `[seed] orgPhoneNumbers/${result.id} -> ${orgSlug} ${result.created ? "created" : "updated"}`,
    );
  }

  console.log("[seed] done");
}

main().catch((error) => {
  console.error("[seed] failed:", error.message || error);
  process.exit(1);
});
