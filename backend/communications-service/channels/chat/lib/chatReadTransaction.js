const { FieldValue } = require("firebase-admin/firestore");
const { getFirestore } = require("../../../lib/firebase");

async function markChatConversationReadInTransaction({
  conversation,
  session,
  readerType,
}) {
  const db = getFirestore();
  const readAt = FieldValue.serverTimestamp();

  return db.runTransaction(async (transaction) => {
    const conversationRef = db.collection("conversations").doc(conversation.id);
    const sessionRef = db.collection("chatSessions").doc(session.sessionId);

    const [conversationSnap, sessionSnap] = await Promise.all([
      transaction.get(conversationRef),
      transaction.get(sessionRef),
    ]);

    if (!conversationSnap.exists) {
      throw new Error("conversation_not_found");
    }

    if (!sessionSnap.exists) {
      throw new Error("session_not_found");
    }

    const conversationPatch =
      readerType === "agent"
        ? {
            unreadAgent: 0,
            lastReadByAgentAt: readAt,
            updatedAt: FieldValue.serverTimestamp(),
          }
        : {
            unreadVisitor: 0,
            lastReadByVisitorAt: readAt,
            updatedAt: FieldValue.serverTimestamp(),
          };

    const sessionPatch =
      readerType === "agent"
        ? {
            unreadAgent: 0,
            lastReadByAgentAt: readAt,
            updatedAt: FieldValue.serverTimestamp(),
          }
        : {
            unreadVisitor: 0,
            lastReadByVisitorAt: readAt,
            updatedAt: FieldValue.serverTimestamp(),
          };

    transaction.set(conversationRef, conversationPatch, { merge: true });
    transaction.set(sessionRef, sessionPatch, { merge: true });

    return {
      conversationId: conversation.id,
      sessionId: session.sessionId,
      readerType,
      unreadAgent: readerType === "agent" ? 0 : conversationSnap.data().unreadAgent ?? 0,
      unreadVisitor: readerType === "visitor" ? 0 : conversationSnap.data().unreadVisitor ?? 0,
      lastReadByAgentAt: readerType === "agent" ? readAt : conversationSnap.data().lastReadByAgentAt || null,
      lastReadByVisitorAt:
        readerType === "visitor" ? readAt : conversationSnap.data().lastReadByVisitorAt || null,
    };
  });
}

module.exports = {
  markChatConversationReadInTransaction,
};
