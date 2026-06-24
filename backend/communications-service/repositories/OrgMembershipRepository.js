const { getFirestore } = require("../lib/firebase");
const { buildOrgMembershipDocument } = require("../models/OrgMembership");
const { buildOrgMembershipDocId } = require("../lib/orgMembershipId");
const { normalizeOrgSlug } = require("../lib/orgSlug");

const COLLECTION = "orgMemberships";

class OrgMembershipRepository {
  collection() {
    return getFirestore().collection(COLLECTION);
  }

  docRefFor(uid, orgSlug) {
    const docId = buildOrgMembershipDocId(uid, orgSlug);
    if (!docId) return null;
    return this.collection().doc(docId);
  }

  async getByUidAndOrg(uid, orgSlug) {
    const ref = this.docRefFor(uid, orgSlug);
    if (!ref) return null;
    const snap = await ref.get();
    if (!snap.exists) return null;
    return { id: snap.id, ...snap.data() };
  }

  async listActiveByUid(uid) {
    const normalizedUid = String(uid || "").trim();
    if (!normalizedUid) return [];

    const snap = await this.collection()
      .where("uid", "==", normalizedUid)
      .where("status", "==", "active")
      .get();

    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  async upsert(uid, orgSlug, input = {}) {
    const ref = this.docRefFor(uid, orgSlug);
    if (!ref) {
      throw new Error("uid and orgSlug are required");
    }

    const existing = await ref.get();
    const document = buildOrgMembershipDocument({
      ...input,
      uid: String(uid).trim(),
      orgSlug: normalizeOrgSlug(orgSlug),
      createdAt: existing.exists ? existing.data().createdAt : undefined,
      grantedAt: existing.exists ? existing.data().grantedAt : input.grantedAt,
    });

    await ref.set(document, { merge: true });
    return { id: ref.id, created: !existing.exists, data: document };
  }

  async revoke(uid, orgSlug, grantedBy = null) {
    const ref = this.docRefFor(uid, orgSlug);
    if (!ref) {
      throw new Error("uid and orgSlug are required");
    }

    const { FieldValue } = require("firebase-admin/firestore");
    await ref.set(
      {
        status: "revoked",
        grantedBy: grantedBy || null,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return { id: ref.id, revoked: true };
  }
}

module.exports = OrgMembershipRepository;
