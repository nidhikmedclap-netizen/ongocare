const ConversationRepository = require("../../../repositories/ConversationRepository");
const ChatSessionRepository = require("../repositories/ChatSessionRepository");
const { markChatConversationReadInTransaction } = require("../lib/chatReadTransaction");
const {
  getInboxOrgScope,
  isConversationInOrgScope,
} = require("../../../lib/hubInboxAccess");

class ChatReadService {
  constructor(deps = {}) {
    this.conversationRepo = deps.conversationRepo || new ConversationRepository();
    this.sessionRepo = deps.sessionRepo || new ChatSessionRepository();
  }

  async getChatConversation(conversationId) {
    const normalizedConversationId = decodeURIComponent(conversationId || "").trim();
    if (!normalizedConversationId) {
      const error = new Error("conversation_id_required");
      error.status = 400;
      throw error;
    }

    const conversation = await this.conversationRepo.getById(normalizedConversationId);
    if (!conversation) {
      const error = new Error("conversation_not_found");
      error.status = 404;
      throw error;
    }

    if (conversation.channel !== "chat" && !conversation.visitorId) {
      const error = new Error("not_chat_conversation");
      error.status = 400;
      throw error;
    }

    const sessionId = conversation.activeSessionId;
    if (!sessionId) {
      const error = new Error("active_session_not_found");
      error.status = 409;
      throw error;
    }

    const session = await this.sessionRepo.getById(sessionId);
    if (!session) {
      const error = new Error("session_not_found");
      error.status = 404;
      throw error;
    }

    if (session.conversationId !== conversation.id) {
      const error = new Error("session_conversation_mismatch");
      error.status = 409;
      throw error;
    }

    return { conversation, session };
  }

  assertVisitorCanRead({ conversation, session, tokenClaims }) {
    if (tokenClaims.visitorId !== conversation.visitorId) {
      const error = new Error("visitor_conversation_mismatch");
      error.status = 403;
      throw error;
    }

    if (tokenClaims.siteKey !== conversation.siteKey || tokenClaims.orgSlug !== conversation.orgSlug) {
      const error = new Error("visitor_token_mismatch");
      error.status = 403;
      throw error;
    }

    if (session.visitorId !== tokenClaims.visitorId) {
      const error = new Error("visitor_session_mismatch");
      error.status = 403;
      throw error;
    }
  }

  assertAgentCanRead({ conversation, req }) {
    const scope = getInboxOrgScope(req);
    if (!isConversationInOrgScope({ ...conversation, id: conversation.id }, scope)) {
      const error = new Error("hub_forbidden");
      error.status = 403;
      throw error;
    }
  }

  async markConversationRead({ conversationId, req, readerType, tokenClaims = null }) {
    const { conversation, session } = await this.getChatConversation(conversationId);

    if (readerType === "visitor") {
      this.assertVisitorCanRead({ conversation, session, tokenClaims });
    } else {
      this.assertAgentCanRead({ conversation, req });
    }

    return markChatConversationReadInTransaction({
      conversation: { ...conversation, id: conversation.id },
      session,
      readerType,
    });
  }
}

module.exports = ChatReadService;
