const { FieldValue } = require("firebase-admin/firestore");
const { getFirestore } = require("./firebase");
const { buildContactDocument } = require("../models/Contact");
const { buildConversationDocument } = require("../models/Conversation");
const { buildCommunicationDocument, callCommunicationId } = require("../models/CommunicationEvent");
const { buildContactKey, buildConversationKey } = require("./phoneE164");
const CallRepository = require("../repositories/CallRepository");

const callRepository = new CallRepository();

function buildCallPreview(callPayload) {
  const direction = (callPayload.direction || "outbound").toLowerCase();
  const duration = callPayload.durationSec;
  if (duration != null && duration > 0) {
    return `${direction === "inbound" ? "Incoming" : "Outgoing"} call · ${duration}s`;
  }
  return `${direction === "inbound" ? "Missed" : "Outgoing"} call`;
}

function buildCallCommunicationPayload({
  conversationId,
  contactId,
  callPayload,
  peerE164,
  businessLineE164,
  orgSlug,
  existingCreatedAt,
}) {
  const callSid = callPayload.callSid;
  const direction = (callPayload.direction || "outbound").toLowerCase();
  const status = callPayload.status || "completed";
  const preview = buildCallPreview({ ...callPayload, direction });

  return buildCommunicationDocument({
    conversationId,
    contactId,
    orgSlug: orgSlug || null,
    type: "call",
    channel: "voice",
    direction: direction === "inbound" ? "inbound" : "outbound",
    provider: "twilio",
    providerSid: callSid,
    preview,
    status,
    occurredAt: callPayload.completedAt || callPayload.answeredAt || undefined,
    createdAt: existingCreatedAt,
    metadata: {
      callSid,
      from: callPayload.from || null,
      to: callPayload.to || null,
      peerE164: peerE164 || null,
      businessLineE164: businessLineE164 || null,
      durationSec: callPayload.durationSec ?? null,
      answeredAt: callPayload.answeredAt || null,
      completedAt: callPayload.completedAt || null,
      childCallSid: callPayload.childCallSid || null,
      recordingSid: callPayload.recordingSid || null,
      recordingUrl: callPayload.recordingUrl || null,
    },
  });
}

function resolveContactFromReads(contactKey, peerE164, deterministicSnap, legacySnap) {
  if (deterministicSnap.exists) {
    return {
      contactRef: deterministicSnap.ref,
      contactId: contactKey,
      existingData: deterministicSnap.data(),
      isNew: false,
    };
  }

  if (legacySnap && !legacySnap.empty) {
    const legacyDoc = legacySnap.docs[0];
    return {
      contactRef: legacyDoc.ref,
      contactId: legacyDoc.id,
      existingData: legacyDoc.data(),
      isNew: false,
    };
  }

  return {
    contactRef: deterministicSnap.ref,
    contactId: contactKey,
    existingData: null,
    isNew: true,
  };
}

async function linkCompletedCallInTransaction(callPayload, parties) {
  const db = getFirestore();
  const callSid = callPayload.callSid;
  const communicationId = callCommunicationId(callSid);
  const conversationId = buildConversationKey(parties.peerE164, parties.businessLineE164);
  const contactKey = buildContactKey(parties.peerE164);
  const callActivityAt = callPayload.completedAt || callPayload.answeredAt || FieldValue.serverTimestamp();

  return db.runTransaction(async (transaction) => {
    const contactDeterministicRef = db.collection("contacts").doc(contactKey);
    const conversationRef = db.collection("conversations").doc(conversationId);
    const communicationRef = db.collection("communications").doc(communicationId);
    const callRef = db.collection("calls").doc(callSid);

    const deterministicSnap = await transaction.get(contactDeterministicRef);
    let legacySnap = null;
    if (!deterministicSnap.exists) {
      const legacyQuery = db
        .collection("contacts")
        .where("phonesE164", "array-contains", parties.peerE164)
        .limit(1);
      legacySnap = await transaction.get(legacyQuery);
    }

    const [conversationSnap, communicationSnap, callSnap] = await Promise.all([
      transaction.get(conversationRef),
      transaction.get(communicationRef),
      transaction.get(callRef),
    ]);

    const contactState = resolveContactFromReads(
      contactKey,
      parties.peerE164,
      deterministicSnap,
      legacySnap,
    );

    if (contactState.isNew) {
      transaction.set(
        contactState.contactRef,
        buildContactDocument({
          phone: parties.peerE164,
          displayName: callPayload.callerName || parties.peerE164,
          source: "twilio",
          callActivityAt,
        }),
        { merge: true },
      );
    } else {
      const patch = {
        lastCallAt: callActivityAt,
        lastActivityAt: callActivityAt,
        updatedAt: FieldValue.serverTimestamp(),
      };
      const existingName = contactState.existingData?.displayName;
      if (callPayload.callerName && (!existingName || existingName === parties.peerE164)) {
        patch.displayName = String(callPayload.callerName).trim();
      }
      transaction.set(contactState.contactRef, patch, { merge: true });
    }

    const contactId = contactState.contactId;

    if (!conversationSnap.exists) {
      transaction.set(
        conversationRef,
        buildConversationDocument({
          contactId,
          peerE164: parties.peerE164,
          businessLineE164: parties.businessLineE164,
          orgSlug: parties.orgSlug || null,
          channel: "mixed",
        }),
        { merge: true },
      );
    } else if (conversationSnap.data().contactId !== contactId) {
      transaction.set(
        conversationRef,
        {
          contactId,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    }

    let communicationPreview;
    let communicationOccurredAt;

    if (communicationSnap.exists) {
      const existingComm = communicationSnap.data();
      communicationPreview = existingComm.preview;
      communicationOccurredAt = existingComm.occurredAt;
    } else {
      const communicationDocument = buildCallCommunicationPayload({
        conversationId,
        contactId,
        callPayload: { ...callPayload, direction: parties.direction },
        peerE164: parties.peerE164,
        businessLineE164: parties.businessLineE164,
        orgSlug: parties.orgSlug || null,
        existingCreatedAt: undefined,
      });
      communicationPreview = communicationDocument.preview;
      communicationOccurredAt = communicationDocument.occurredAt;
      transaction.set(communicationRef, communicationDocument, { merge: true });
      transaction.set(
        conversationRef,
        { callCount: FieldValue.increment(1) },
        { merge: true },
      );
    }

    const conversationActivityPatch = {
      lastMessagePreview: communicationPreview || null,
      lastMessageAt: communicationOccurredAt || FieldValue.serverTimestamp(),
      lastCommunicationType: "call",
      lastCommunicationId: communicationId,
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (parties.orgSlug) {
      conversationActivityPatch.orgSlug = parties.orgSlug;
    }
    transaction.set(conversationRef, conversationActivityPatch, { merge: true });

    const existingCallData = callSnap.exists ? callSnap.data() : null;
    const callDocument = callRepository.mergeDocument(existingCallData, {
      ...callPayload,
      callSid,
      contactId,
      conversationId,
      communicationId,
      peerE164: parties.peerE164,
      businessLineE164: parties.businessLineE164,
      orgSlug: parties.orgSlug || null,
    });
    transaction.set(callRef, callDocument, { merge: true });

    return {
      linked: true,
      contactId,
      conversationId,
      communicationId,
      parties,
    };
  });
}

module.exports = {
  linkCompletedCallInTransaction,
  buildCallCommunicationPayload,
  buildCallPreview,
  resolveContactFromReads,
};
