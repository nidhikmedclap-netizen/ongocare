const { FieldValue } = require("firebase-admin/firestore");
const { normalizeOrgSlug } = require("../../../lib/orgSlug");
const { defaultSiteAi } = require("../lib/chatDefaults");

function normalizeSiteKey(raw) {
  const siteKey = String(raw || "").trim().toLowerCase();
  if (!siteKey || !/^[a-z0-9][a-z0-9_-]{0,63}$/.test(siteKey)) return null;
  return siteKey;
}

function buildChatSiteDocument(input = {}) {
  const siteKey = normalizeSiteKey(input.siteKey);
  const orgSlug = normalizeOrgSlug(input.orgSlug);
  if (!siteKey) {
    throw new Error("siteKey is required for chatSite");
  }
  if (!orgSlug) {
    throw new Error("orgSlug is required for chatSite");
  }

  return {
    siteKey,
    orgSlug,
    name: input.name ? String(input.name).trim() : siteKey,
    domains: Array.isArray(input.domains)
      ? [...new Set(input.domains.map((value) => String(value).trim()).filter(Boolean))]
      : [],
    status: input.status || "active",
    theme: input.theme && typeof input.theme === "object" ? input.theme : {},
    preChatForm: input.preChatForm && typeof input.preChatForm === "object" ? input.preChatForm : {},
    businessHours:
      input.businessHours && typeof input.businessHours === "object"
        ? input.businessHours
        : {},
    offlineMessage: input.offlineMessage ? String(input.offlineMessage).trim() : null,
    routing: input.routing && typeof input.routing === "object" ? input.routing : {},
    ai: defaultSiteAi(input.ai || {}),
    createdAt: input.createdAt || FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
}

module.exports = {
  buildChatSiteDocument,
  normalizeSiteKey,
};
