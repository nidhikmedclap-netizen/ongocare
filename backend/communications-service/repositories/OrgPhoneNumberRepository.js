const { getFirestore } = require("../lib/firebase");
const { buildOrgPhoneNumberDocument } = require("../models/OrgPhoneNumber");
const { buildOrgPhoneNumberDocId } = require("../lib/orgPhoneNumberId");
const { normalizeE164 } = require("../lib/phoneE164");

const COLLECTION = "orgPhoneNumbers";

class OrgPhoneNumberRepository {
  collection() {
    return getFirestore().collection(COLLECTION);
  }

  docRefForE164(e164) {
    const docId = buildOrgPhoneNumberDocId(e164);
    if (!docId) return null;
    return this.collection().doc(docId);
  }

  async getByE164(e164) {
    const ref = this.docRefForE164(e164);
    if (!ref) return null;
    const snap = await ref.get();
    if (!snap.exists) return null;
    return { id: snap.id, ...snap.data() };
  }

  async upsert(e164, input = {}) {
    const normalized = normalizeE164(e164);
    const ref = this.docRefForE164(normalized);
    if (!ref) {
      throw new Error("e164 is required");
    }
    const existing = await ref.get();
    const document = buildOrgPhoneNumberDocument({
      ...input,
      e164: normalized,
      createdAt: existing.exists ? existing.data().createdAt : undefined,
    });
    await ref.set(document, { merge: true });
    return { id: ref.id, created: !existing.exists, data: document };
  }

  async listAll() {
    const snap = await this.collection().get();
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }
}

module.exports = OrgPhoneNumberRepository;
