const { getFirestore } = require("../lib/firebase");
const { buildServiceAccountDocument } = require("../models/ServiceAccount");

const COLLECTION = "serviceAccounts";

class ServiceAccountRepository {
  collection() {
    return getFirestore().collection(COLLECTION);
  }

  async getByKeyId(keyId) {
    const normalizedKeyId = String(keyId || "").trim();
    if (!normalizedKeyId) return null;
    const snap = await this.collection().doc(normalizedKeyId).get();
    if (!snap.exists) return null;
    return { id: snap.id, ...snap.data() };
  }

  async listActive() {
    const snap = await this.collection().where("status", "==", "active").get();
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  async upsert(keyId, input = {}) {
    const normalizedKeyId = String(keyId || "").trim();
    if (!normalizedKeyId) {
      throw new Error("keyId is required");
    }

    const ref = this.collection().doc(normalizedKeyId);
    const existing = await ref.get();
    const document = buildServiceAccountDocument({
      ...input,
      keyId: normalizedKeyId,
      createdAt: existing.exists ? existing.data().createdAt : undefined,
    });

    await ref.set(document, { merge: true });
    return { id: normalizedKeyId, created: !existing.exists, data: document };
  }
}

module.exports = ServiceAccountRepository;
