const { getFirestore } = require("../lib/firebase");
const { buildContactDocument } = require("../models/Contact");
const { normalizeE164 } = require("../lib/phoneE164");

const COLLECTION = "contacts";

class ContactRepository {
  collection() {
    return getFirestore().collection(COLLECTION);
  }

  async getById(contactId) {
    const snap = await this.collection().doc(contactId).get();
    if (!snap.exists) return null;
    return { id: snap.id, ...snap.data() };
  }

  async findByE164(e164) {
    const normalized = normalizeE164(e164);
    if (!normalized) return null;

    const snap = await this.collection()
      .where("phonesE164", "array-contains", normalized)
      .limit(1)
      .get();

    if (snap.empty) return null;
    const doc = snap.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  async create(input) {
    const ref = this.collection().doc();
    const document = buildContactDocument(input);
    await ref.set(document);
    return { id: ref.id, ...document };
  }

  async createWithId(contactId, input) {
    if (!contactId) {
      throw new Error("contactId is required");
    }
    const ref = this.collection().doc(contactId);
    const document = buildContactDocument(input);
    await ref.set(document, { merge: true });
    return { id: ref.id, ...document };
  }

  async update(contactId, patch) {
    const ref = this.collection().doc(contactId);
    await ref.set(
      {
        ...patch,
        updatedAt: require("firebase-admin/firestore").FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    return this.getById(contactId);
  }
}

module.exports = ContactRepository;
