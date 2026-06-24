const { randomUUID } = require("crypto");
const { chatCommunicationId } = require("../../../models/CommunicationEvent");

function sanitizeClientMessageId(raw) {
  const value = String(raw || "").trim();
  if (!value) return null;
  const sanitized = value.replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 120);
  return sanitized || null;
}

function resolveVisitorChatMessageDocId(sessionId, clientMessageId) {
  const session = String(sessionId || "").trim();
  const clientId = sanitizeClientMessageId(clientMessageId);
  if (clientId) {
    return chatCommunicationId(`client_${session}_${clientId}`);
  }
  return chatCommunicationId(randomUUID());
}

function resolveAgentChatMessageDocId(conversationId, clientMessageId) {
  const conversation = String(conversationId || "").trim();
  const clientId = sanitizeClientMessageId(clientMessageId);
  if (clientId) {
    return chatCommunicationId(`agent_${conversation}_${clientId}`);
  }
  return chatCommunicationId(randomUUID());
}

module.exports = {
  sanitizeClientMessageId,
  resolveVisitorChatMessageDocId,
  resolveAgentChatMessageDocId,
  resolveChatMessageDocId: resolveVisitorChatMessageDocId,
};
