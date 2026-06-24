const { normalizeOrgSlug } = require("./orgSlug");
const { MEMBERSHIP_ROLES } = require("./hubPermissions");

const SUPPORTED_ORGANIZATIONS = Object.freeze([
  { orgSlug: "ongo", name: "Ongo", product: "weight_loss" },
  { orgSlug: "esa", name: "ESA", product: "esa" },
  { orgSlug: "mmj", name: "MMJ", product: "mmj" },
  { orgSlug: "weightloss", name: "Weight Loss", product: "weight_loss" },
]);

const SUPPORTED_ORG_SLUGS = new Set(SUPPORTED_ORGANIZATIONS.map((row) => row.orgSlug));

function parseOrgSlugList(raw, separator = "|") {
  const text = String(raw || "").trim();
  if (!text) return [];

  return [
    ...new Set(
      text
        .split(separator)
        .map((value) => normalizeOrgSlug(value))
        .filter(Boolean),
    ),
  ];
}

function parseOrgMemberships(raw) {
  const memberships = [];
  const text = String(raw || "").trim();
  if (!text) return memberships;

  for (const entry of text.split(",")) {
    const trimmed = entry.trim();
    if (!trimmed) continue;

    const [uidPart, rest] = trimmed.split("=");
    const uid = String(uidPart || "").trim();
    if (!uid || !rest) {
      console.warn("[seed] skipping invalid membership entry:", trimmed);
      continue;
    }

    const [orgPart, rolePart, statusPart] = rest.split(":");
    const orgSlug = normalizeOrgSlug(orgPart);
    const role = String(rolePart || "agent").trim().toLowerCase();
    const status = String(statusPart || "active").trim().toLowerCase();

    if (!orgSlug) {
      console.warn("[seed] skipping membership with invalid orgSlug:", trimmed);
      continue;
    }

    if (!MEMBERSHIP_ROLES.includes(role)) {
      console.warn("[seed] skipping membership with invalid role:", trimmed);
      continue;
    }

    if (!SUPPORTED_ORG_SLUGS.has(orgSlug)) {
      console.warn(
        "[seed] membership orgSlug not in supported catalog:",
        orgSlug,
        `(entry: ${trimmed})`,
      );
    }

    memberships.push({ uid, orgSlug, role, status });
  }

  return memberships;
}

function parseServiceAccounts(raw) {
  const accounts = [];
  const text = String(raw || "").trim();
  if (!text) return accounts;

  for (const entry of text.split(",")) {
    const trimmed = entry.trim();
    if (!trimmed) continue;

    const [keyIdPart, orgPart] = trimmed.split("=");
    const keyId = String(keyIdPart || "").trim();
    const orgSlugs = parseOrgSlugList(orgPart, "|");

    if (!keyId || !orgSlugs.length) {
      console.warn("[seed] skipping invalid service account entry:", trimmed);
      continue;
    }

    for (const orgSlug of orgSlugs) {
      if (!SUPPORTED_ORG_SLUGS.has(orgSlug)) {
        console.warn(
          "[seed] service account orgSlug not in supported catalog:",
          orgSlug,
          `(entry: ${trimmed})`,
        );
      }
    }

    accounts.push({ keyId, orgSlugs });
  }

  return accounts;
}

function resolveServiceAccountsFromEnv(env = process.env) {
  const accounts = parseServiceAccounts(env.HUB_SERVICE_ACCOUNTS);
  const seen = new Set(accounts.map((row) => row.keyId));

  const keyId = String(env.HUB_SERVICE_ACCOUNT_KEY_ID || "").trim();
  if (keyId && !seen.has(keyId)) {
    const orgSlugs = parseOrgSlugList(
      env.SERVICE_ACCOUNT_ORG_SLUGS || env.COMMUNICATIONS_DEFAULT_ORG_SLUG,
      "|",
    );
    if (orgSlugs.length) {
      accounts.push({ keyId, orgSlugs, fromEnvKeyId: true });
    }
  }

  return accounts;
}

module.exports = {
  SUPPORTED_ORGANIZATIONS,
  SUPPORTED_ORG_SLUGS,
  parseOrgMemberships,
  parseServiceAccounts,
  parseOrgSlugList,
  resolveServiceAccountsFromEnv,
};
