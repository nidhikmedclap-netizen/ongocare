const { getFirestore } = require("../lib/firebase");
const { buildOrganizationDocument } = require("../models/Organization");
const { normalizeOrgSlug } = require("../lib/orgSlug");

const COLLECTION = "organizations";

class OrganizationRepository {
  collection() {
    return getFirestore().collection(COLLECTION);
  }

  async getBySlug(orgSlug) {
    const slug = normalizeOrgSlug(orgSlug);
    if (!slug) return null;
    const snap = await this.collection().doc(slug).get();
    if (!snap.exists) return null;
    return { id: snap.id, ...snap.data() };
  }

  async upsert(orgSlug, input = {}) {
    const slug = normalizeOrgSlug(orgSlug);
    if (!slug) {
      throw new Error("orgSlug is required");
    }
    const ref = this.collection().doc(slug);
    const existing = await ref.get();
    const document = buildOrganizationDocument({
      ...input,
      orgSlug: slug,
      createdAt: existing.exists ? existing.data().createdAt : undefined,
    });
    await ref.set(document, { merge: true });
    return { id: slug, created: !existing.exists, data: document };
  }
}

module.exports = OrganizationRepository;
