const { FieldValue } = require("firebase-admin/firestore");
const { normalizeOrgSlug } = require("../../../lib/orgSlug");
const { normalizeSiteKey } = require("./ChatSite");
const { normalizeVisitorId } = require("./ChatVisitor");
const { CHAT_SESSION_STATUSES } = require("../lib/chatEnums");
const {
  defaultSessionAi,
  defaultSessionHandoff,
  defaultSessionContext,
  defaultSessionQualification,
} = require("../lib/chatDefaults");

function normalizeSessionId(raw) {
  const sessionId = String(raw || "").trim();
  if (!sessionId || sessionId.length > 128) return null;
  return sessionId;
}

function buildChatSessionDocument(input = {}) {
  const sessionId = normalizeSessionId(input.sessionId);
  const orgSlug = normalizeOrgSlug(input.orgSlug);
  const siteKey = normalizeSiteKey(input.siteKey);
  const visitorId = normalizeVisitorId(input.visitorId);
  const conversationId = String(input.conversationId || "").trim();
  const status = String(input.status || "queued").trim().toLowerCase();

  if (!sessionId) {
    throw new Error("sessionId is required for chatSession");
  }
  if (!orgSlug) {
    throw new Error("orgSlug is required for chatSession");
  }
  if (!siteKey) {
    throw new Error("siteKey is required for chatSession");
  }
  if (!visitorId) {
    throw new Error("visitorId is required for chatSession");
  }
  if (!conversationId) {
    throw new Error("conversationId is required for chatSession");
  }
  if (!CHAT_SESSION_STATUSES.includes(status)) {
    throw new Error(`invalid chatSession status: ${status}`);
  }

  return {
    sessionId,
    orgSlug,
    siteKey,
    visitorId,
    conversationId,
    contactId: input.contactId ? String(input.contactId).trim() : null,
    status,
    assignedTo: input.assignedTo ? String(input.assignedTo).trim() : null,
    assignedType: input.assignedType ? String(input.assignedType).trim().toLowerCase() : null,
    assignedAt: input.assignedAt || null,
    queuePosition: input.queuePosition ?? null,
    startedAt: input.startedAt || FieldValue.serverTimestamp(),
    endedAt: input.endedAt || null,
    lastMessageAt: input.lastMessageAt || null,
    lastVisitorMessageAt: input.lastVisitorMessageAt || null,
    lastAgentMessageAt: input.lastAgentMessageAt || null,
    unreadAgent: input.unreadAgent ?? 0,
    unreadVisitor: input.unreadVisitor ?? 0,
    lastReadByAgentAt: input.lastReadByAgentAt || null,
    lastReadByVisitorAt: input.lastReadByVisitorAt || null,
    context: defaultSessionContext({ ...input.context, siteKey }),
    qualification: defaultSessionQualification(input.qualification || {}),
    ai: defaultSessionAi(input.ai || {}),
    handoff: defaultSessionHandoff(input.handoff || {}),
    createdAt: input.createdAt || FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
}

module.exports = {
  buildChatSessionDocument,
  normalizeSessionId,
};
