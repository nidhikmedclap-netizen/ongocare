const { getFirestore } = require("../../../lib/firebase");
const { buildChatSiteDocument, normalizeSiteKey } = require("../models/ChatSite");

const COLLECTION = "chatSites";

class ChatSiteRepository {
  collection() {
    return getFirestore().collection(COLLECTION);
  }

  async getBySiteKey(siteKey) {
    const key = normalizeSiteKey(siteKey);
    if (!key) return null;
    const snap = await this.collection().doc(key).get();
    if (!snap.exists) return null;
    return { id: snap.id, ...snap.data() };
  }

  async listByOrgSlug(orgSlug) {
    const snap = await this.collection()
      .where("orgSlug", "==", orgSlug)
      .where("status", "==", "active")
      .get();
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  async upsert(siteKey, input = {}) {
    const key = normalizeSiteKey(siteKey);
    if (!key) {
      throw new Error("siteKey is required");
    }

    const ref = this.collection().doc(key);
    const existing = await ref.get();
    const document = buildChatSiteDocument({
      ...input,
      siteKey: key,
      createdAt: existing.exists ? existing.data().createdAt : undefined,
    });

    await ref.set(document, { merge: true });
    return { id: key, created: !existing.exists, data: document };
  }
}

module.exports = ChatSiteRepository;
