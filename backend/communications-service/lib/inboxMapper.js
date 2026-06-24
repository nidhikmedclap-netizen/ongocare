const { timestampToIso } = require("./inboxCursor");

function mapAssignmentFields(conversation) {
  return {
    assignedTo: conversation.assignedTo || null,
    assignedType: conversation.assignedType || null,
    assignedAt: timestampToIso(conversation.assignedAt),
    assignedBy: conversation.assignedBy || null,
  };
}

function mapChatUnreadFields(conversation) {
  if (conversation.channel !== "chat" && !conversation.visitorId) {
    return {};
  }

  return {
    unreadAgent: conversation.unreadAgent ?? 0,
    unreadVisitor: conversation.unreadVisitor ?? 0,
    lastReadByAgentAt: timestampToIso(conversation.lastReadByAgentAt),
    lastReadByVisitorAt: timestampToIso(conversation.lastReadByVisitorAt),
  };
}

function mapConversationListItem(conversation, contact) {
  return {
    conversationId: conversation.id,
    contactId: conversation.contactId || null,
    peerE164: conversation.peerE164 || null,
    businessLineE164: conversation.businessLineE164 || null,
    orgSlug: conversation.orgSlug || null,
    displayName: contact?.displayName || conversation.peerE164 || null,
    lastMessagePreview: conversation.lastMessagePreview || null,
    lastCommunicationType: conversation.lastCommunicationType || null,
    lastActivityAt: timestampToIso(conversation.lastMessageAt),
    unreadCount: conversation.unreadCount ?? 0,
    callCount: conversation.callCount ?? 0,
    smsCount: conversation.smsCount ?? 0,
    voicemailCount: conversation.voicemailCount ?? 0,
    chatCount: conversation.chatCount ?? 0,
    channel: conversation.channel || null,
    ...mapAssignmentFields(conversation),
    ...mapChatUnreadFields(conversation),
  };
}

function mapConversationDetail(conversation) {
  return {
    conversationId: conversation.id,
    contactId: conversation.contactId || null,
    peerE164: conversation.peerE164 || null,
    businessLineE164: conversation.businessLineE164 || null,
    orgSlug: conversation.orgSlug || null,
    channel: conversation.channel || "mixed",
    status: conversation.status || "open",
    callCount: conversation.callCount ?? 0,
    smsCount: conversation.smsCount ?? 0,
    voicemailCount: conversation.voicemailCount ?? 0,
    unreadCount: conversation.unreadCount ?? 0,
    lastMessagePreview: conversation.lastMessagePreview || null,
    lastCommunicationType: conversation.lastCommunicationType || null,
    lastActivityAt: timestampToIso(conversation.lastMessageAt),
    chatCount: conversation.chatCount ?? 0,
    ...mapAssignmentFields(conversation),
    ...mapChatUnreadFields(conversation),
  };
}

function mapContactSummary(contact) {
  if (!contact) return null;
  return {
    contactId: contact.id,
    displayName: contact.displayName || null,
    phonesE164: contact.phonesE164 || [],
    lastSmsAt: timestampToIso(contact.lastSmsAt),
    lastCallAt: timestampToIso(contact.lastCallAt),
    lastChatAt: timestampToIso(contact.lastChatAt),
    lastActivityAt: timestampToIso(contact.lastActivityAt),
  };
}

function mapTimelineItem(communication) {
  return {
    communicationId: communication.id,
    type: communication.type || null,
    channel: communication.channel || null,
    direction: communication.direction || null,
    preview: communication.preview || null,
    body: communication.body ?? null,
    status: communication.status || null,
    occurredAt: timestampToIso(communication.occurredAt),
    contactId: communication.contactId || null,
    provider: communication.provider || null,
    providerSid: communication.providerSid || null,
    contentType: communication.contentType || null,
    sessionId: communication.sessionId || null,
    sender: communication.sender || null,
    metadata: communication.metadata || {},
  };
}

module.exports = {
  mapAssignmentFields,
  mapChatUnreadFields,
  mapConversationListItem,
  mapConversationDetail,
  mapContactSummary,
  mapTimelineItem,
};
