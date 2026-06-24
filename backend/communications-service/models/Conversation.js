const { FieldValue } = require("firebase-admin/firestore");
const { buildConversationKey, normalizeE164 } = require("../lib/phoneE164");
const { buildChatConversationKey } = require("../channels/chat/lib/chatConversationKey");
const {
  defaultConversationAi,
  defaultConversationSummary,
  defaultConversationLead,
} = require("../channels/chat/lib/chatDefaults");

function buildPhoneConversationDocument(input = {}) {
  const peerE164 = normalizeE164(input.peerE164);
  const businessLineE164 = normalizeE164(input.businessLineE164);
  const conversationKey = buildConversationKey(peerE164, businessLineE164);

  if (!conversationKey) {
    throw new Error("peerE164 and businessLineE164 are required for phone conversation");
  }

  const document = {
    conversationKey,
    contactId: input.contactId,
    peerE164,
    businessLineE164,
    channel: input.channel || "mixed",
    provider: input.provider || "twilio",
    status: input.status || "open",
    lastMessagePreview: input.lastMessagePreview || null,
    lastMessageAt: input.lastMessageAt || null,
    lastCommunicationType: input.lastCommunicationType || null,
    lastCommunicationId: input.lastCommunicationId || null,
    unreadCount: input.unreadCount || 0,
    callCount: input.callCount ?? 0,
    smsCount: input.smsCount ?? 0,
    voicemailCount: input.voicemailCount ?? 0,
    chatCount: input.chatCount ?? 0,
    assignedTo: input.assignedTo || null,
    assignedType: input.assignedType || null,
    assignedAt: input.assignedAt || null,
    assignedBy: input.assignedBy || null,
    tags: input.tags || [],
    createdAt: input.createdAt || FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (input.orgSlug) {
    document.orgSlug = input.orgSlug;
  }

  return document;
}

function buildChatConversationDocument(input = {}) {
  const visitorId = String(input.visitorId || "").trim();
  const siteKey = String(input.siteKey || "").trim().toLowerCase();
  const conversationKey =
    input.conversationKey || buildChatConversationKey(input.orgSlug, visitorId);

  if (!conversationKey) {
    throw new Error("orgSlug and visitorId are required for chat conversation");
  }
  if (!siteKey) {
    throw new Error("siteKey is required for chat conversation");
  }
  if (!input.contactId) {
    throw new Error("contactId is required for chat conversation");
  }

  const document = {
    conversationKey,
    contactId: input.contactId,
    channel: "chat",
    provider: input.provider || "hub",
    orgSlug: input.orgSlug,
    siteKey,
    visitorId,
    activeSessionId: input.activeSessionId ? String(input.activeSessionId).trim() : null,
    peerE164: null,
    businessLineE164: null,
    status: input.status || "open",
    lastMessagePreview: input.lastMessagePreview || null,
    lastMessageAt: input.lastMessageAt || null,
    lastCommunicationType: input.lastCommunicationType || null,
    lastCommunicationId: input.lastCommunicationId || null,
    unreadCount: input.unreadCount || 0,
    unreadAgent: input.unreadAgent ?? 0,
    unreadVisitor: input.unreadVisitor ?? 0,
    lastReadByAgentAt: input.lastReadByAgentAt || null,
    lastReadByVisitorAt: input.lastReadByVisitorAt || null,
    callCount: input.callCount ?? 0,
    smsCount: input.smsCount ?? 0,
    voicemailCount: input.voicemailCount ?? 0,
    chatCount: input.chatCount ?? 0,
    assignedTo: input.assignedTo || null,
    assignedType: input.assignedType || null,
    assignedAt: input.assignedAt || null,
    assignedBy: input.assignedBy || null,
    tags: input.tags || [],
    ai: defaultConversationAi(input.ai || {}),
    conversationSummary: defaultConversationSummary(input.conversationSummary),
    lead: defaultConversationLead(input.lead || {}),
    createdAt: input.createdAt || FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  return document;
}

function buildConversationDocument(input = {}) {
  const channel = String(input.channel || "").trim().toLowerCase();
  if (channel === "chat" || input.visitorId) {
    return buildChatConversationDocument(input);
  }
  return buildPhoneConversationDocument(input);
}

module.exports = {
  buildConversationDocument,
  buildPhoneConversationDocument,
  buildChatConversationDocument,
  buildConversationKey,
};
