const { FieldValue } = require("firebase-admin/firestore");
const { getFirestore } = require("../../../lib/firebase");
const { buildChatConversationDocument } = require("../../../models/Conversation");
const { buildContactDocument } = require("../../../models/Contact");
const { buildChatSessionDocument } = require("../models/ChatSession");
const { buildChatConversationKey } = require("./chatConversationKey");

function buildChatContactId(orgSlug, visitorId) {
  return `chat_${orgSlug}_${visitorId}`;
}

async function startChatSessionInTransaction({
  sessionId,
  site,
  visitor,
  context,
}) {
  const db = getFirestore();
  const orgSlug = site.orgSlug;
  const visitorId = visitor.visitorId;
  const siteKey = site.siteKey;
  const conversationId = buildChatConversationKey(orgSlug, visitorId);
  const contactId = visitor.contactId || buildChatContactId(orgSlug, visitorId);

  if (!conversationId) {
    throw new Error("invalid_chat_conversation_key");
  }

  return db.runTransaction(async (transaction) => {
    const contactRef = db.collection("contacts").doc(contactId);
    const conversationRef = db.collection("conversations").doc(conversationId);
    const sessionRef = db.collection("chatSessions").doc(sessionId);
    const visitorRef = db.collection("chatVisitors").doc(visitorId);

    const [contactSnap, conversationSnap, visitorSnap] = await Promise.all([
      transaction.get(contactRef),
      transaction.get(conversationRef),
      transaction.get(visitorRef),
    ]);

    if (!visitorSnap.exists) {
      throw new Error("visitor_not_found");
    }

    if (!contactSnap.exists) {
      transaction.set(
        contactRef,
        buildContactDocument({
          displayName: visitor.displayName || `Chat ${visitorId.slice(0, 8)}`,
          email: visitor.email || null,
          source: "chat",
          visitorIds: [visitorId],
        }),
        { merge: true },
      );
    } else {
      const existingVisitorIds = contactSnap.data().visitorIds || [];
      if (!existingVisitorIds.includes(visitorId)) {
        transaction.set(
          contactRef,
          {
            visitorIds: [...new Set([...existingVisitorIds, visitorId])],
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
      }
    }

    if (!conversationSnap.exists) {
      transaction.set(
        conversationRef,
        buildChatConversationDocument({
          contactId,
          orgSlug,
          siteKey,
          visitorId,
          activeSessionId: sessionId,
          status: "open",
        }),
        { merge: true },
      );
    } else {
      transaction.set(
        conversationRef,
        {
          activeSessionId: sessionId,
          contactId,
          siteKey,
          visitorId,
          orgSlug,
          channel: "chat",
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    }

    transaction.set(
      sessionRef,
      buildChatSessionDocument({
        sessionId,
        orgSlug,
        siteKey,
        visitorId,
        conversationId,
        contactId,
        status: "active",
        context,
      }),
      { merge: true },
    );

    transaction.set(
      visitorRef,
      {
        contactId,
        lastSeenAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return {
      sessionId,
      conversationId,
      contactId,
      orgSlug,
      siteKey,
      visitorId,
      createdSession: true,
      createdConversation: !conversationSnap.exists,
      createdContact: !contactSnap.exists,
    };
  });
}

module.exports = {
  buildChatContactId,
  startChatSessionInTransaction,
};
