const { randomUUID } = require("crypto");
const { FieldValue } = require("firebase-admin/firestore");
const { getFirestore } = require("../../../lib/firebase");
const {
  buildCommunicationDocument,
  buildChatPreview,
  chatCommunicationId,
} = require("../../../models/CommunicationEvent");

function buildAssignmentPreview({ action, assigneeLabel }) {
  if (action === "unassign") {
    return "Unassigned";
  }
  if (assigneeLabel) {
    return `Assigned to ${assigneeLabel}`;
  }
  return "Assigned";
}

async function applyChatAssignmentInTransaction({
  conversation,
  session,
  action,
  assignment = null,
  assigneeLabel = null,
  assignedBy = null,
}) {
  const db = getFirestore();
  const activityAt = FieldValue.serverTimestamp();
  const preview = buildAssignmentPreview({ action, assigneeLabel });
  const communicationId = chatCommunicationId(randomUUID());

  return db.runTransaction(async (transaction) => {
    const conversationRef = db.collection("conversations").doc(conversation.id);
    const sessionRef = db.collection("chatSessions").doc(session.sessionId);
    const communicationRef = db.collection("communications").doc(communicationId);

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
      action === "unassign"
        ? {
            assignedTo: null,
            assignedType: null,
            assignedAt: null,
            assignedBy: null,
            updatedAt: FieldValue.serverTimestamp(),
          }
        : {
            assignedTo: assignment.assignedTo,
            assignedType: assignment.assignedType,
            assignedAt: activityAt,
            assignedBy: assignedBy || null,
            updatedAt: FieldValue.serverTimestamp(),
          };

    const sessionPatch =
      action === "unassign"
        ? {
            assignedTo: null,
            assignedType: null,
            assignedAt: null,
            updatedAt: FieldValue.serverTimestamp(),
          }
        : {
            assignedTo: assignment.assignedTo,
            assignedType: assignment.assignedType,
            assignedAt: activityAt,
            updatedAt: FieldValue.serverTimestamp(),
          };

    transaction.set(conversationRef, conversationPatch, { merge: true });
    transaction.set(sessionRef, sessionPatch, { merge: true });

    const communicationDocument = buildCommunicationDocument({
      type: "chat",
      channel: "chat",
      direction: "outbound",
      conversationId: conversation.id,
      contactId: conversation.contactId,
      orgSlug: conversation.orgSlug,
      sessionId: session.sessionId,
      siteKey: session.siteKey,
      body: null,
      preview,
      contentType: "system_event",
      status: "sent",
      sender: {
        kind: "system",
        displayName: "System",
      },
      metadata: {
        systemEvent: {
          type: action === "unassign" ? "assignment_cleared" : "assignment",
          payload: {
            action,
            assignedTo: assignment?.assignedTo || null,
            assignedType: assignment?.assignedType || null,
            assignedBy: assignedBy || null,
            assigneeLabel: assigneeLabel || null,
          },
        },
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
      },
      { merge: true },
    );

    return {
      communicationId,
      conversationId: conversation.id,
      sessionId: session.sessionId,
      preview,
      assignment: action === "unassign" ? null : assignment,
    };
  });
}

module.exports = {
  applyChatAssignmentInTransaction,
  buildAssignmentPreview,
};
