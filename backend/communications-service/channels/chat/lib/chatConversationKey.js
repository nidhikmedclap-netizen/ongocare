const { normalizeOrgSlug } = require("../../../lib/orgSlug");

function buildChatConversationKey(orgSlug, visitorId) {
  const slug = normalizeOrgSlug(orgSlug);
  const visitor = String(visitorId || "").trim();
  if (!slug || !visitor) return null;
  return `chat_${slug}_${visitor}`;
}

function parseChatConversationKey(conversationKey) {
  const text = String(conversationKey || "").trim();
  if (!text.startsWith("chat_")) return null;

  const parts = text.split("_");
  if (parts.length < 3) return null;

  const orgSlug = normalizeOrgSlug(parts[1]);
  const visitorId = parts.slice(2).join("_");
  if (!orgSlug || !visitorId) return null;

  return { orgSlug, visitorId };
}

module.exports = {
  buildChatConversationKey,
  parseChatConversationKey,
};
