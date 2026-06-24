#!/usr/bin/env node
/**
 * Seed organizations (multi-brand catalog), orgMemberships, and serviceAccounts.
 *
 * Usage:
 *   node scripts/seedOrgMemberships.js
 *   node scripts/seedOrgMemberships.js --dry-run
 *
 * Env:
 *   ORG_MEMBERSHIPS=uid=orgSlug:role,uid=orgSlug:role
 *   HUB_SERVICE_ACCOUNTS=keyId=ongo|esa|mmj|weightloss
 *   HUB_SERVICE_ACCOUNT_KEY_ID=sms-app
 *   SERVICE_ACCOUNT_ORG_SLUGS=ongo|esa|mmj|weightloss
 *
 * Role defaults to agent. Status defaults to active.
 * Supported org slugs: ongo, esa, mmj, weightloss
 */
require("dotenv").config();

const { initFirebaseAdmin } = require("../lib/firebase");
const {
  SUPPORTED_ORGANIZATIONS,
  parseOrgMemberships,
  resolveServiceAccountsFromEnv,
} = require("../lib/seedMembershipConfig");
const OrganizationRepository = require("../repositories/OrganizationRepository");
const OrgMembershipRepository = require("../repositories/OrgMembershipRepository");
const ServiceAccountRepository = require("../repositories/ServiceAccountRepository");

const dryRun = process.argv.includes("--dry-run");

async function seedOrganizations(orgRepo) {
  const results = [];

  for (const org of SUPPORTED_ORGANIZATIONS) {
    if (dryRun) {
      console.log(`[seed] dry-run organizations/${org.orgSlug} upsert`);
      results.push({ orgSlug: org.orgSlug, created: null });
      continue;
    }

    const existing = await orgRepo.getBySlug(org.orgSlug);
    const result = await orgRepo.upsert(org.orgSlug, {
      name: existing?.name || org.name,
      product: existing?.product || org.product,
      status: existing?.status || "active",
    });
    console.log(
      `[seed] organizations/${org.orgSlug} ${result.created ? "created" : "updated"}`,
    );
    results.push({ orgSlug: org.orgSlug, created: result.created });
  }

  return results;
}

async function seedMemberships(membershipRepo, memberships) {
  const results = [];

  for (const row of memberships) {
    const docId = `${row.uid}__${row.orgSlug}`;
    if (dryRun) {
      console.log(
        `[seed] dry-run orgMemberships/${docId} role=${row.role} status=${row.status}`,
      );
      results.push({ id: docId, created: null });
      continue;
    }

    const result = await membershipRepo.upsert(row.uid, row.orgSlug, {
      role: row.role,
      status: row.status,
      grantedBy: "system",
    });
    console.log(
      `[seed] orgMemberships/${result.id} role=${row.role} ${result.created ? "created" : "updated"}`,
    );
    results.push({ id: result.id, created: result.created });
  }

  return results;
}

async function seedServiceAccounts(serviceAccountRepo, accounts) {
  const results = [];

  for (const row of accounts) {
    if (dryRun) {
      console.log(
        `[seed] dry-run serviceAccounts/${row.keyId} orgSlugs=${row.orgSlugs.join("|")}`,
      );
      results.push({ keyId: row.keyId, created: null });
      continue;
    }

    const result = await serviceAccountRepo.upsert(row.keyId, {
      orgSlugs: row.orgSlugs,
      role: "service",
      status: "active",
      description: row.fromEnvKeyId ? "Seeded from HUB_SERVICE_ACCOUNT_KEY_ID" : null,
    });
    console.log(
      `[seed] serviceAccounts/${result.id} orgSlugs=${row.orgSlugs.join("|")} ${result.created ? "created" : "updated"}`,
    );
    results.push({ keyId: result.id, created: result.created });
  }

  return results;
}

async function main() {
  initFirebaseAdmin();

  const memberships = parseOrgMemberships(process.env.ORG_MEMBERSHIPS);
  const serviceAccounts = resolveServiceAccountsFromEnv(process.env);

  if (!memberships.length) {
    console.warn("[seed] ORG_MEMBERSHIPS is empty — seeding organizations and service accounts only");
  }

  if (!serviceAccounts.length) {
    console.warn(
      "[seed] no service accounts configured — set HUB_SERVICE_ACCOUNTS and/or HUB_SERVICE_ACCOUNT_KEY_ID",
    );
  }

  const orgRepo = new OrganizationRepository();
  const membershipRepo = new OrgMembershipRepository();
  const serviceAccountRepo = new ServiceAccountRepository();

  const orgResults = await seedOrganizations(orgRepo);
  const membershipResults = await seedMemberships(membershipRepo, memberships);
  const serviceAccountResults = await seedServiceAccounts(serviceAccountRepo, serviceAccounts);

  console.log(
    `[seed] done organizations=${orgResults.length} memberships=${membershipResults.length} serviceAccounts=${serviceAccountResults.length}${dryRun ? " (dry-run)" : ""}`,
  );
}

main().catch((error) => {
  console.error("[seed] failed:", error.message || error);
  process.exit(1);
});
