const { FieldValue } = require("firebase-admin/firestore");
const ConversationRepository = require("../repositories/ConversationRepository");
const { normalizeE164 } = require("../lib/phoneE164");

class ConversationService {
  constructor(deps = {}) {
    this.repo = deps.conversationRepository || new ConversationRepository();
  }

  async findOrCreate({ contactId, peerE164, businessLineE164, channel = "mixed" }) {
    const peer = normalizeE164(peerE164);
    const line = normalizeE164(businessLineE164);
    if (!peer || !line) {
      throw new Error("peerE164 and businessLineE164 are required");
    }
    if (!contactId) {
      throw new Error("contactId is required");
    }

    const existing = await this.repo.findByPeerAndLine(peer, line);
    if (existing) {
      if (existing.contactId !== contactId) {
        return this.repo.update(existing.id, { contactId });
      }
      return existing;
    }

    return this.repo.create({
      contactId,
      peerE164: peer,
      businessLineE164: line,
      channel,
    });
  }

  async updateLastActivity(conversationId, {
    preview,
    occurredAt,
    communicationType,
    communicationId,
  }) {
    return this.repo.update(conversationId, {
      lastMessagePreview: preview || null,
      lastMessageAt: occurredAt || FieldValue.serverTimestamp(),
      lastCommunicationType: communicationType || null,
      lastCommunicationId: communicationId || null,
    });
  }
}

module.exports = ConversationService;
