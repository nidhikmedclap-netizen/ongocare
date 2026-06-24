const { getFirestore } = require("../../../lib/firebase");
const {
  buildChatVisitorDocument,
  normalizeVisitorId,
} = require("../models/ChatVisitor");

const COLLECTION = "chatVisitors";

class ChatVisitorRepository {
  collection() {
    return getFirestore().collection(COLLECTION);
  }

  async getById(visitorId) {
    const id = normalizeVisitorId(visitorId);
    if (!id) return null;
    const snap = await this.collection().doc(id).get();
    if (!snap.exists) return null;
    return { id: snap.id, ...snap.data() };
  }

  async upsert(visitorId, input = {}) {
    const id = normalizeVisitorId(visitorId);
    if (!id) {
      throw new Error("visitorId is required");
    }

    const ref = this.collection().doc(id);
    const existing = await ref.get();
    const existingData = existing.exists ? existing.data() : {};
    const document = buildChatVisitorDocument({
      ...input,
      visitorId: id,
      existingFingerprint: existingData.fingerprint || null,
      createdAt: existing.exists ? existingData.createdAt : undefined,
      firstSeenAt: existing.exists ? existingData.firstSeenAt : undefined,
      firstContext: existing.exists ? existingData.firstContext : input.firstContext,
    });

    await ref.set(document, { merge: true });
    return { id, created: !existing.exists, data: document };
  }
}

module.exports = ChatVisitorRepository;
