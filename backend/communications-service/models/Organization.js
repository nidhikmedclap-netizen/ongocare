const { FieldValue } = require("firebase-admin/firestore");
const { normalizeOrgSlug } = require("../lib/orgSlug");

function buildOrganizationDocument(input = {}) {
  const orgSlug = normalizeOrgSlug(input.orgSlug);
  if (!orgSlug) {
    throw new Error("orgSlug is required for organization");
  }

  return {
    orgSlug,
    name: input.name ? String(input.name).trim() : orgSlug,
    status: input.status || "active",
    product: input.product || null,
    defaultMessagingLineE164: input.defaultMessagingLineE164 || null,
    defaultVoiceLineE164: input.defaultVoiceLineE164 || null,
    createdAt: input.createdAt || FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
}

module.exports = {
  buildOrganizationDocument,
};
