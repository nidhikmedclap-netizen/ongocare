const { FieldValue } = require("firebase-admin/firestore");
const {
  normalizeSender,
  normalizeContentType,
} = require("../channels/chat/lib/chatEnums");

function buildCommunicationDocument(input = {}) {
  const type = input.type;
  if (!type) {
    throw new Error("communication type is required");
  }

  const document = {
    conversationId: input.conversationId,
    contactId: input.contactId,
    type,
    channel:
      input.channel ||
      (type === "sms" ? "sms" : type === "chat" ? "chat" : "voice"),
    direction: input.direction || null,
    provider: input.provider || (type === "chat" ? "hub" : "twilio"),
    providerSid: input.providerSid || null,
    body: input.body || null,
    preview: input.preview || null,
    status: input.status || null,
    metadata: input.metadata || {},
    occurredAt: input.occurredAt || FieldValue.serverTimestamp(),
    createdAt: input.createdAt || FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (input.orgSlug) {
    document.orgSlug = input.orgSlug;
  }

  if (type === "chat") {
    document.sessionId = input.sessionId ? String(input.sessionId).trim() : null;
    document.siteKey = input.siteKey ? String(input.siteKey).trim().toLowerCase() : null;
    document.contentType = normalizeContentType(input.contentType);
    document.sender = normalizeSender(input.sender);
  }

  return document;
}

function callCommunicationId(callSid) {
  return `call_${callSid}`;
}

function smsCommunicationId(messageSid) {
  return `sms_${messageSid}`;
}

function chatCommunicationId(messageId) {
  return `chat_${messageId}`;
}

const SMS_PREVIEW_MAX_LEN = 80;
const CHAT_PREVIEW_MAX_LEN = 120;

function buildSmsPreview(body) {
  const text = body != null ? String(body).trim() : "";
  if (!text) return "SMS";
  if (text.length <= SMS_PREVIEW_MAX_LEN) return text;
  return `${text.slice(0, SMS_PREVIEW_MAX_LEN - 1)}…`;
}

function buildChatPreview({ body, contentType, systemEventType } = {}) {
  if (contentType === "system_event" && systemEventType) {
    return String(systemEventType).replace(/_/g, " ");
  }
  if (contentType === "summary") {
    return "Conversation summary updated";
  }
  if (contentType === "attachment") {
    return "Attachment";
  }

  const text = body != null ? String(body).trim() : "";
  if (!text) return "Chat";
  if (text.length <= CHAT_PREVIEW_MAX_LEN) return text;
  return `${text.slice(0, CHAT_PREVIEW_MAX_LEN - 1)}…`;
}

module.exports = {
  buildCommunicationDocument,
  callCommunicationId,
  smsCommunicationId,
  chatCommunicationId,
  buildSmsPreview,
  buildChatPreview,
  SMS_PREVIEW_MAX_LEN,
  CHAT_PREVIEW_MAX_LEN,
};
