const { getFirestore } = require("../../../lib/firebase");
const ConversationRepository = require("../../../repositories/ConversationRepository");
const ChatSessionRepository = require("../repositories/ChatSessionRepository");
const { sendAgentChatMessageInTransaction } = require("../lib/chatMessageTransaction");
const {
  getInboxOrgScope,
  isConversationInOrgScope,
} = require("../../../lib/hubInboxAccess");
const { normalizeContentType, CHAT_CONTENT_TYPES } = require("../lib/chatEnums");

class ChatAgentMessageService {
  constructor(deps = {}) {
    this.conversationRepo = deps.conversationRepo || new ConversationRepository();
    this.sessionRepo = deps.sessionRepo || new ChatSessionRepository();
    this.db = deps.db || null;
  }

  firestore() {
    return this.db || getFirestore();
  }

  resolveAgentIdentity(req) {
    if (req.firebaseUser?.uid) {
      return {
        uid: req.firebaseUser.uid,
        displayName:
          req.firebaseUser.name ||
          req.firebaseUser.displayName ||
          req.firebaseUser.email ||
          null,
      };
    }

    return {
      uid: null,
      displayName: "Service Agent",
    };
  }

  async loadAgentDisplayName(uid) {
    if (!uid) return null;
    const snap = await this.firestore().collection("users").doc(uid).get();
    if (!snap.exists) return null;
    const data = snap.data() || {};
    const parts = [data.firstName, data.lastName].filter(Boolean).join(" ").trim();
    return data.displayName || data.name || parts || null;
  }

  async sendAgentMessage({ conversationId, body, req }) {
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

    const scope = getInboxOrgScope(req);
    if (!isConversationInOrgScope({ ...conversation, id: conversation.id }, scope)) {
      const error = new Error("hub_forbidden");
      error.status = 403;
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

    const contentType = normalizeContentType(body.contentType);
    if (!CHAT_CONTENT_TYPES.includes(contentType)) {
      const error = new Error("invalid_content_type");
      error.status = 400;
      throw error;
    }

    if (contentType !== "text") {
      const error = new Error("unsupported_content_type");
      error.status = 400;
      throw error;
    }

    const agent = this.resolveAgentIdentity(req);
    if (agent.uid) {
      agent.displayName =
        (await this.loadAgentDisplayName(agent.uid)) || agent.displayName;
    }

    try {
      return await sendAgentChatMessageInTransaction({
        conversation: { ...conversation, id: conversation.id },
        session,
        agent,
        body: body.body,
        contentType,
        clientMessageId: body.clientMessageId,
      });
    } catch (error) {
      if (error.message === "message_body_required") {
        const err = new Error("message_body_required");
        err.status = 400;
        throw err;
      }
      throw error;
    }
  }
}

module.exports = ChatAgentMessageService;
