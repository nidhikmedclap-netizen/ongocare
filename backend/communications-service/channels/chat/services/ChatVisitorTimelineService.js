const { getFirestore } = require("../../../lib/firebase");
const { timestampToIso } = require("../../../lib/inboxCursor");
const ChatSessionRepository = require("../repositories/ChatSessionRepository");

const OPEN_SESSION_STATUSES = new Set(["queued", "active", "idle"]);

class ChatVisitorTimelineService {
  constructor(deps = {}) {
    this.sessionRepo = deps.sessionRepo || new ChatSessionRepository();
    this.db = deps.db || null;
  }

  firestore() {
    return this.db || getFirestore();
  }

  async assertSessionAccess(sessionId, tokenClaims) {
    const session = await this.sessionRepo.getById(sessionId);
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

    return session;
  }

  mapTimelineItem(communication) {
    const sender = communication.sender || {};
    return {
      communicationId: communication.id,
      body: communication.body ?? null,
      preview: communication.preview || null,
      direction: communication.direction || null,
      contentType: communication.contentType || null,
      occurredAt: timestampToIso(communication.occurredAt),
      sender: {
        kind: sender.kind || null,
        displayName: sender.displayName || null,
      },
    };
  }

  async listSessionMessages({ sessionId, tokenClaims, since = null }) {
    const normalizedSessionId = String(sessionId || "").trim();
    if (!normalizedSessionId) {
      const error = new Error("session_id_required");
      error.status = 400;
      throw error;
    }

    const session = await this.assertSessionAccess(normalizedSessionId, tokenClaims);
    const snap = await this.firestore()
      .collection("communications")
      .where("sessionId", "==", session.sessionId)
      .where("type", "==", "chat")
      .get();

    let messages = snap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((row) => row.contentType === "text" || row.contentType === "system_event")
      .sort((left, right) => {
        const leftAt = left.occurredAt?.toMillis?.() ?? 0;
        const rightAt = right.occurredAt?.toMillis?.() ?? 0;
        if (leftAt !== rightAt) return leftAt - rightAt;
        return left.id.localeCompare(right.id);
      })
      .map((row) => this.mapTimelineItem(row));

    if (since) {
      const sinceMs = new Date(since).getTime();
      if (!Number.isNaN(sinceMs)) {
        messages = messages.filter((row) => {
          const rowMs = new Date(row.occurredAt || 0).getTime();
          return rowMs > sinceMs;
        });
      }
    }

    return {
      sessionId: session.sessionId,
      conversationId: session.conversationId,
      messages,
    };
  }
}

module.exports = ChatVisitorTimelineService;
