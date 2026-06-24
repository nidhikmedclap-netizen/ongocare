const { FieldValue } = require("firebase-admin/firestore");
const { getFirestore } = require("./firebase");
const { buildContactDocument } = require("../models/Contact");
const { buildConversationDocument } = require("../models/Conversation");
const {
  buildCommunicationDocument,
  smsCommunicationId,
  buildSmsPreview,
} = require("../models/CommunicationEvent");
const { buildContactKey, buildConversationKey } = require("./phoneE164");
const { resolveContactFromReads } = require("./callLinkTransaction");

function buildSmsCommunicationPayload({
  conversationId,
  contactId,
  smsPayload,
  peerE164,
  businessLineE164,
  orgSlug,
  direction,
  existingCreatedAt,
}) {
  const messageSid = smsPayload.messageSid;
  const preview = buildSmsPreview(smsPayload.body);
  const resolvedDirection = direction === "outbound" ? "outbound" : "inbound";
  const status =
    smsPayload.status ||
    (resolvedDirection === "outbound" ? "queued" : "received");

  const metadata = {
    messageSid,
    from: smsPayload.from || null,
    to: smsPayload.to || null,
    peerE164: peerE164 || null,
    businessLineE164: businessLineE164 || null,
    numSegments: smsPayload.numSegments ?? null,
    numMedia: smsPayload.numMedia ?? 0,
    messagingServiceSid: smsPayload.messagingServiceSid || null,
    accountSid: smsPayload.accountSid || null,
    errorCode: null,
    errorMessage: null,
  };

  if (resolvedDirection === "outbound" && status) {
    metadata.statusHistory = [status];
  }

  return buildCommunicationDocument({
    conversationId,
    contactId,
    orgSlug: orgSlug || null,
    type: "sms",
    channel: "sms",
    direction: resolvedDirection,
    provider: "twilio",
    providerSid: messageSid,
    body: smsPayload.body || null,
    preview,
    status,
    occurredAt: smsPayload.occurredAt || undefined,
    createdAt: existingCreatedAt,
    metadata,
  });
}

async function linkSmsInTransaction(smsPayload, parties) {
  const db = getFirestore();
  const messageSid = smsPayload.messageSid;
  const communicationId = smsCommunicationId(messageSid);
  const conversationId = buildConversationKey(parties.peerE164, parties.businessLineE164);
  const contactKey = buildContactKey(parties.peerE164);
  const smsActivityAt = smsPayload.occurredAt || FieldValue.serverTimestamp();

  return db.runTransaction(async (transaction) => {
    const contactDeterministicRef = db.collection("contacts").doc(contactKey);
    const conversationRef = db.collection("conversations").doc(conversationId);
    const communicationRef = db.collection("communications").doc(communicationId);

    const deterministicSnap = await transaction.get(contactDeterministicRef);
    let legacySnap = null;
    if (!deterministicSnap.exists) {
      const legacyQuery = db
        .collection("contacts")
        .where("phonesE164", "array-contains", parties.peerE164)
        .limit(1);
      legacySnap = await transaction.get(legacyQuery);
    }

    const [conversationSnap, communicationSnap] = await Promise.all([
      transaction.get(conversationRef),
      transaction.get(communicationRef),
    ]);

    if (communicationSnap.exists) {
      return {
        linked: true,
        duplicate: true,
        contactId: communicationSnap.data().contactId || null,
        conversationId: communicationSnap.data().conversationId || conversationId,
        communicationId,
        parties,
      };
    }

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
          displayName: parties.peerE164,
          source: "twilio",
          smsActivityAt,
          lastSmsAt: smsActivityAt,
          lastActivityAt: smsActivityAt,
        }),
        { merge: true },
      );
    } else {
      transaction.set(
        contactState.contactRef,
        {
          lastSmsAt: smsActivityAt,
          lastActivityAt: smsActivityAt,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
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

    const communicationDocument = buildSmsCommunicationPayload({
      conversationId,
      contactId,
      smsPayload,
      peerE164: parties.peerE164,
      businessLineE164: parties.businessLineE164,
      orgSlug: parties.orgSlug || null,
      direction: parties.direction,
      existingCreatedAt: undefined,
    });

    transaction.set(communicationRef, communicationDocument, { merge: true });

    const conversationActivityPatch = {
      lastMessagePreview: communicationDocument.preview || null,
      lastMessageAt: communicationDocument.occurredAt || smsActivityAt,
      lastCommunicationType: "sms",
      lastCommunicationId: communicationId,
      smsCount: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (parties.orgSlug) {
      conversationActivityPatch.orgSlug = parties.orgSlug;
    }
    transaction.set(conversationRef, conversationActivityPatch, { merge: true });

    return {
      linked: true,
      duplicate: false,
      contactId,
      conversationId,
      communicationId,
      parties,
    };
  });
}

async function linkInboundSmsInTransaction(smsPayload, parties) {
  return linkSmsInTransaction(smsPayload, { ...parties, direction: "inbound" });
}

async function linkOutboundSmsInTransaction(smsPayload, parties) {
  return linkSmsInTransaction(smsPayload, { ...parties, direction: "outbound" });
}

module.exports = {
  linkSmsInTransaction,
  linkInboundSmsInTransaction,
  linkOutboundSmsInTransaction,
  buildSmsCommunicationPayload,
};
