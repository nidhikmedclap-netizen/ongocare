const { getFirestore } = require("../../../lib/firebase");
const {
  buildChatSessionDocument,
  normalizeSessionId,
} = require("../models/ChatSession");

const COLLECTION = "chatSessions";

class ChatSessionRepository {
  collection() {
    return getFirestore().collection(COLLECTION);
  }

  async getById(sessionId) {
    const id = normalizeSessionId(sessionId);
    if (!id) return null;
    const snap = await this.collection().doc(id).get();
    if (!snap.exists) return null;
    return { id: snap.id, ...snap.data() };
  }

  async listActiveByOrgSlug(orgSlug) {
    const snap = await this.collection()
      .where("orgSlug", "==", orgSlug)
      .where("status", "in", ["queued", "active", "idle"])
      .orderBy("startedAt", "desc")
      .get();
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  async upsert(sessionId, input = {}) {
    const id = normalizeSessionId(sessionId);
    if (!id) {
      throw new Error("sessionId is required");
    }

    const ref = this.collection().doc(id);
    const existing = await ref.get();
    const document = buildChatSessionDocument({
      ...input,
      sessionId: id,
      createdAt: existing.exists ? existing.data().createdAt : undefined,
      startedAt: existing.exists ? existing.data().startedAt : input.startedAt,
    });

    await ref.set(document, { merge: true });
    return { id, created: !existing.exists, data: document };
  }
}

module.exports = ChatSessionRepository;
