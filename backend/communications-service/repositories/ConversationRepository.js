const { getFirestore } = require("../lib/firebase");
const { buildConversationDocument } = require("../models/Conversation");
const { buildConversationKey } = require("../lib/phoneE164");
const { buildChatConversationKey } = require("../channels/chat/lib/chatConversationKey");

const COLLECTION = "conversations";

class ConversationRepository {
  collection() {
    return getFirestore().collection(COLLECTION);
  }

  conversationDocId(peerE164, businessLineE164) {
    return buildConversationKey(peerE164, businessLineE164);
  }

  chatConversationDocId(orgSlug, visitorId) {
    return buildChatConversationKey(orgSlug, visitorId);
  }

  async findByVisitorAndOrg(visitorId, orgSlug) {
    const id = this.chatConversationDocId(visitorId, orgSlug);
    if (!id) return null;
    return this.getById(id);
  }

  async getById(conversationId) {
    const snap = await this.collection().doc(conversationId).get();
    if (!snap.exists) return null;
    return { id: snap.id, ...snap.data() };
  }

  async findByPeerAndLine(peerE164, businessLineE164) {
    const id = this.conversationDocId(peerE164, businessLineE164);
    if (!id) return null;
    return this.getById(id);
  }

  async create(input) {
    const document = buildConversationDocument(input);
    const id = document.conversationKey;
    const ref = this.collection().doc(id);
    await ref.set(document, { merge: true });
    return { id, ...document };
  }

  async update(conversationId, patch) {
    const ref = this.collection().doc(conversationId);
    await ref.set(
      {
        ...patch,
        updatedAt: require("firebase-admin/firestore").FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    return this.getById(conversationId);
  }
}

module.exports = ConversationRepository;
