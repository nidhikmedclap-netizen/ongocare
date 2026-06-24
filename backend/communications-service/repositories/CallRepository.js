const { FieldValue } = require("firebase-admin/firestore");
const { getFirestore } = require("../lib/firebase");

const COLLECTION = "calls";

class CallRepository {
  collection() {
    return getFirestore().collection(COLLECTION);
  }

  async getById(callSid) {
    const snap = await this.collection().doc(callSid).get();
    if (!snap.exists) return null;
    return { id: snap.id, ...snap.data() };
  }

  mergeDocument(existingData, incoming) {
    const document = { updatedAt: FieldValue.serverTimestamp() };

    for (const [key, value] of Object.entries(incoming)) {
      if (key === "callSid") {
        document.callSid = value;
        continue;
      }
      if (value === null || value === undefined) continue;
      document[key] = value;
    }

    if (!existingData || !existingData.createdAt) {
      document.createdAt = FieldValue.serverTimestamp();
    }

    return document;
  }

  async upsert(callSid, payload) {
    const ref = this.collection().doc(callSid);
    const existing = await ref.get();
    const existingData = existing.exists ? existing.data() : null;
    const document = this.mergeDocument(existingData, { ...payload, callSid });
    await ref.set(document, { merge: true });
    return { id: callSid, created: !existing.exists, data: document };
  }
}

module.exports = CallRepository;
