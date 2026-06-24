const ChatSessionRepository = require("../repositories/ChatSessionRepository");
const ChatVisitorRepository = require("../repositories/ChatVisitorRepository");
const { sendVisitorChatMessageInTransaction } = require("../lib/chatMessageTransaction");
const { normalizeContentType, CHAT_CONTENT_TYPES } = require("../lib/chatEnums");

const OPEN_SESSION_STATUSES = new Set(["queued", "active", "idle"]);

class ChatMessageService {
  constructor(deps = {}) {
    this.sessionRepo = deps.sessionRepo || new ChatSessionRepository();
    this.visitorRepo = deps.visitorRepo || new ChatVisitorRepository();
  }

  async sendVisitorMessage({ sessionId, body, tokenClaims }) {
    const normalizedSessionId = String(sessionId || "").trim();
    if (!normalizedSessionId) {
      const error = new Error("session_id_required");
      error.status = 400;
      throw error;
    }

    const session = await this.sessionRepo.getById(normalizedSessionId);
    if (!session) {
      const error = new Error("session_not_found");
      error.status = 404;
      throw error;
    }

    if (session.visitorId !== tokenClaims.visitorId) {
      const error = new Error("session_forbidden");
      error.status = 403;
      throw error;
    }

    if (session.siteKey !== tokenClaims.siteKey || session.orgSlug !== tokenClaims.orgSlug) {
      const error = new Error("session_token_mismatch");
      error.status = 403;
      throw error;
    }

    if (!OPEN_SESSION_STATUSES.has(session.status)) {
      const error = new Error("session_closed");
      error.status = 409;
      throw error;
    }

    const visitor = await this.visitorRepo.getById(session.visitorId);
    if (!visitor || visitor.status !== "active") {
      const error = new Error("visitor_not_found");
      error.status = 404;
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

    try {
      const result = await sendVisitorChatMessageInTransaction({
        session,
        visitor,
        body: body.body,
        contentType,
        clientMessageId: body.clientMessageId,
      });

      return result;
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

module.exports = ChatMessageService;
