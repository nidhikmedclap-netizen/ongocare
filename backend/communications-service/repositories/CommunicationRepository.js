const { getFirestore } = require("../lib/firebase");
const { buildCommunicationDocument } = require("../models/CommunicationEvent");

const COLLECTION = "communications";

class CommunicationRepository {
  collection() {
    return getFirestore().collection(COLLECTION);
  }

  async getById(communicationId) {
    const snap = await this.collection().doc(communicationId).get();
    if (!snap.exists) return null;
    return { id: snap.id, ...snap.data() };
  }

  async findByProviderSid(providerSid) {
    if (!providerSid) return null;
    const snap = await this.collection()
      .where("providerSid", "==", providerSid)
      .limit(1)
      .get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  async upsert(communicationId, input) {
    const ref = this.collection().doc(communicationId);
    const existing = await ref.get();
    const document = buildCommunicationDocument({
      ...input,
      createdAt: existing.exists ? existing.data().createdAt : undefined,
    });
    await ref.set(document, { merge: true });
    return { id: ref.id, ...document };
  }

  async listByConversation(conversationId, limit = 50) {
    const snap = await this.collection()
      .where("conversationId", "==", conversationId)
      .orderBy("occurredAt", "desc")
      .limit(limit)
      .get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
}

module.exports = CommunicationRepository;
