const { FieldValue } = require("firebase-admin/firestore");
const { getFirestore } = require("../../../lib/firebase");
const {
  buildCommunicationDocument,
  buildChatPreview,
} = require("../../../models/CommunicationEvent");
const { normalizeContentType } = require("./chatEnums");
const {
  resolveVisitorChatMessageDocId,
  resolveAgentChatMessageDocId,
  sanitizeClientMessageId,
} = require("./chatMessageId");

async function sendVisitorChatMessageInTransaction({
  session,
  visitor,
  body,
  contentType = "text",
  clientMessageId = null,
}) {
  const db = getFirestore();
  const normalizedContentType = normalizeContentType(contentType);
  const text = String(body || "").trim();

  if (normalizedContentType === "text" && !text) {
    throw new Error("message_body_required");
  }

  const communicationId = resolveVisitorChatMessageDocId(session.sessionId, clientMessageId);
  const preview = buildChatPreview({ body: text, contentType: normalizedContentType });
  const activityAt = FieldValue.serverTimestamp();
  const sanitizedClientMessageId = sanitizeClientMessageId(clientMessageId);

  return db.runTransaction(async (transaction) => {
    const communicationRef = db.collection("communications").doc(communicationId);
    const conversationRef = db.collection("conversations").doc(session.conversationId);
    const contactRef = db.collection("contacts").doc(session.contactId);
    const sessionRef = db.collection("chatSessions").doc(session.sessionId);

    const [communicationSnap, conversationSnap, contactSnap, sessionSnap] = await Promise.all([
      transaction.get(communicationRef),
      transaction.get(conversationRef),
      transaction.get(contactRef),
      transaction.get(sessionRef),
    ]);

    if (!sessionSnap.exists) {
      throw new Error("session_not_found");
    }

    if (!conversationSnap.exists) {
      throw new Error("conversation_not_found");
    }

    if (communicationSnap.exists) {
      const existing = communicationSnap.data();
      return {
        duplicate: true,
        communicationId,
        conversationId: session.conversationId,
        sessionId: session.sessionId,
        preview: existing.preview || null,
        body: existing.body || null,
        occurredAt: existing.occurredAt || null,
      };
    }

    const communicationDocument = buildCommunicationDocument({
      type: "chat",
      channel: "chat",
      direction: "inbound",
      conversationId: session.conversationId,
      contactId: session.contactId,
      orgSlug: session.orgSlug,
      sessionId: session.sessionId,
      siteKey: session.siteKey,
      body: text,
      preview,
      contentType: normalizedContentType,
      status: "sent",
      sender: {
        kind: "visitor",
        visitorId: visitor.visitorId,
        displayName: visitor.displayName || null,
      },
      metadata: {
        clientMessageId: sanitizedClientMessageId,
      },
      occurredAt: activityAt,
    });

    transaction.set(communicationRef, communicationDocument, { merge: false });

    transaction.set(
      conversationRef,
      {
        lastMessagePreview: preview,
        lastMessageAt: activityAt,
        lastCommunicationType: "chat",
        lastCommunicationId: communicationId,
        chatCount: FieldValue.increment(1),
        unreadAgent: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    transaction.set(
      contactRef,
      {
        lastChatAt: activityAt,
        lastActivityAt: activityAt,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    transaction.set(
      sessionRef,
      {
        lastMessageAt: activityAt,
        lastVisitorMessageAt: activityAt,
        unreadAgent: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return {
      duplicate: false,
      communicationId,
      conversationId: session.conversationId,
      sessionId: session.sessionId,
      preview,
      body: text,
      occurredAt: activityAt,
    };
  });
}

async function sendAgentChatMessageInTransaction({
  conversation,
  session,
  agent,
  body,
  contentType = "text",
  clientMessageId = null,
}) {
  const db = getFirestore();
  const normalizedContentType = normalizeContentType(contentType);
  const text = String(body || "").trim();

  if (normalizedContentType === "text" && !text) {
    throw new Error("message_body_required");
  }

  const communicationId = resolveAgentChatMessageDocId(conversation.id, clientMessageId);
  const preview = buildChatPreview({ body: text, contentType: normalizedContentType });
  const activityAt = FieldValue.serverTimestamp();
  const sanitizedClientMessageId = sanitizeClientMessageId(clientMessageId);

  return db.runTransaction(async (transaction) => {
    const communicationRef = db.collection("communications").doc(communicationId);
    const conversationRef = db.collection("conversations").doc(conversation.id);
    const contactRef = db.collection("contacts").doc(conversation.contactId);
    const sessionRef = db.collection("chatSessions").doc(session.sessionId);

    const [communicationSnap, conversationSnap, contactSnap, sessionSnap] = await Promise.all([
      transaction.get(communicationRef),
      transaction.get(conversationRef),
      transaction.get(contactRef),
      transaction.get(sessionRef),
    ]);

    if (!conversationSnap.exists) {
      throw new Error("conversation_not_found");
    }

    if (!sessionSnap.exists) {
      throw new Error("session_not_found");
    }

    if (communicationSnap.exists) {
      const existing = communicationSnap.data();
      return {
        duplicate: true,
        communicationId,
        conversationId: conversation.id,
        sessionId: session.sessionId,
        preview: existing.preview || null,
        body: existing.body || null,
        occurredAt: existing.occurredAt || null,
      };
    }

    const communicationDocument = buildCommunicationDocument({
      type: "chat",
      channel: "chat",
      direction: "outbound",
      conversationId: conversation.id,
      contactId: conversation.contactId,
      orgSlug: conversation.orgSlug,
      sessionId: session.sessionId,
      siteKey: session.siteKey,
      body: text,
      preview,
      contentType: normalizedContentType,
      status: "sent",
      sender: {
        kind: "agent",
        uid: agent.uid || null,
        displayName: agent.displayName || null,
      },
      metadata: {
        clientMessageId: sanitizedClientMessageId,
      },
      occurredAt: activityAt,
    });

    transaction.set(communicationRef, communicationDocument, { merge: false });

    transaction.set(
      conversationRef,
      {
        lastMessagePreview: preview,
        lastMessageAt: activityAt,
        lastCommunicationType: "chat",
        lastCommunicationId: communicationId,
        chatCount: FieldValue.increment(1),
        unreadVisitor: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    if (contactSnap.exists) {
      transaction.set(
        contactRef,
        {
          lastActivityAt: activityAt,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    }

    transaction.set(
      sessionRef,
      {
        lastMessageAt: activityAt,
        lastAgentMessageAt: activityAt,
        unreadVisitor: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return {
      duplicate: false,
      communicationId,
      conversationId: conversation.id,
      sessionId: session.sessionId,
      preview,
      body: text,
      occurredAt: activityAt,
    };
  });
}

module.exports = {
  sendVisitorChatMessageInTransaction,
  sendAgentChatMessageInTransaction,
};
