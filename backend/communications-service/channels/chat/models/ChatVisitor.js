const { FieldValue } = require("firebase-admin/firestore");
const { normalizeOrgSlug } = require("../../../lib/orgSlug");
const { normalizeSiteKey } = require("./ChatSite");
const { defaultConversationLead } = require("../lib/chatDefaults");
const { defaultSessionContext } = require("../lib/chatDefaults");
const { buildVisitorFingerprint } = require("../lib/chatVisitorFingerprint");

function normalizeVisitorFingerprint(input, existingFingerprint = null) {
  if (!input && !existingFingerprint) return null;

  if (input?.anonymousId && input?.userAgentHash !== undefined) {
    return {
      anonymousId: String(input.anonymousId).trim(),
      userAgentHash: input.userAgentHash || null,
      firstSeenIpHash: input.firstSeenIpHash || existingFingerprint?.firstSeenIpHash || null,
    };
  }

  return buildVisitorFingerprint({
    anonymousId: input?.anonymousId,
    userAgent: input?.userAgent,
    ip: input?.ip,
    existingFingerprint,
  });
}

function normalizeVisitorId(raw) {
  const visitorId = String(raw || "").trim();
  if (!visitorId || visitorId.length > 128) return null;
  return visitorId;
}

function buildChatVisitorDocument(input = {}) {
  const visitorId = normalizeVisitorId(input.visitorId);
  const orgSlug = normalizeOrgSlug(input.orgSlug);
  const siteKey = normalizeSiteKey(input.siteKey);
  if (!visitorId) {
    throw new Error("visitorId is required for chatVisitor");
  }
  if (!orgSlug) {
    throw new Error("orgSlug is required for chatVisitor");
  }
  if (!siteKey) {
    throw new Error("siteKey is required for chatVisitor");
  }

  return {
    visitorId,
    orgSlug,
    siteKey,
    contactId: input.contactId ? String(input.contactId).trim() : null,
    displayName: input.displayName ? String(input.displayName).trim() : null,
    email: input.email ? String(input.email).trim().toLowerCase() : null,
    phone: input.phone ? String(input.phone).trim() : null,
    fingerprint: normalizeVisitorFingerprint(input.fingerprint, input.existingFingerprint),
    firstContext: input.firstContext ? defaultSessionContext(input.firstContext) : null,
    lastContext: input.lastContext ? defaultSessionContext(input.lastContext) : null,
    lead: defaultConversationLead(input.lead || {}),
    metadata: input.metadata && typeof input.metadata === "object" ? input.metadata : {},
    status: input.status || "active",
    firstSeenAt: input.firstSeenAt || FieldValue.serverTimestamp(),
    lastSeenAt: input.lastSeenAt || FieldValue.serverTimestamp(),
    createdAt: input.createdAt || FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
}

module.exports = {
  buildChatVisitorDocument,
  normalizeVisitorId,
  normalizeVisitorFingerprint,
};
