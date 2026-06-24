const { FieldValue } = require("firebase-admin/firestore");
const { normalizeOrgSlug } = require("../lib/orgSlug");
const { normalizePermissions } = require("../lib/hubPermissions");

function normalizeOrgSlugList(orgSlugs) {
  const values = Array.isArray(orgSlugs) ? orgSlugs : [orgSlugs];
  const normalized = values
    .map((slug) => normalizeOrgSlug(slug))
    .filter(Boolean);
  return [...new Set(normalized)];
}

function buildServiceAccountDocument(input = {}) {
  const keyId = String(input.keyId || "").trim();
  if (!keyId) {
    throw new Error("keyId is required for serviceAccount");
  }

  const orgSlugs = normalizeOrgSlugList(input.orgSlugs);
  if (!orgSlugs.length) {
    throw new Error("orgSlugs is required for serviceAccount");
  }

  const role = String(input.role || "service").trim().toLowerCase();

  return {
    keyId,
    orgSlugs,
    role,
    permissions: normalizePermissions(input.permissions, "agent"),
    status: input.status || "active",
    description: input.description ? String(input.description).trim() : null,
    createdAt: input.createdAt || FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
}

module.exports = {
  buildServiceAccountDocument,
  normalizeOrgSlugList,
};
