const { getFirestore } = require("../lib/firebase");
const { validateTwilioRequest } = require("../lib/twilio");
const { enrichCallOnCompleted } = require("../lib/twilioEnrichment");
const CallRepository = require("../repositories/CallRepository");
const { CallLinkService, resolveCallParties } = require("../services/CallLinkService");
const { attachOrgSlug } = require("../lib/attachOrgSlug");
const {
  pickString,
  pickInt,
  parseTwilioTimestamp,
  isAnsweredStatus,
  isCompletedStatus,
} = require("../lib/twilioParse");

const callRepository = new CallRepository();
const callLinkService = new CallLinkService({ callRepository });

function resolveTo(body, existingDoc) {
  return (
    pickString(body, "To", "Called") ||
    pickString(body, "CallerId") ||
    (existingDoc && existingDoc.to) ||
    null
  );
}

function mapTwilioCallPayload(body, existingDoc = null) {
  const callSid = pickString(body, "CallSid");
  if (!callSid) {
    const error = new Error("CallSid is required");
    error.status = 400;
    throw error;
  }

  const status = pickString(body, "CallStatus", "Status");
  const eventTimestamp = parseTwilioTimestamp(pickString(body, "Timestamp"));

  const payload = {
    callSid,
    accountSid: pickString(body, "AccountSid"),
    applicationSid: pickString(body, "ApplicationSid"),
    from: pickString(body, "From"),
    to: resolveTo(body, existingDoc),
    caller: pickString(body, "Caller"),
    called: pickString(body, "Called"),
    callerId: pickString(body, "CallerId"),
    callerName: pickString(body, "CallerName"),
    direction: pickString(body, "Direction"),
    status,
    durationSec: pickInt(body, "CallDuration"),
    billableDurationMin: pickInt(body, "Duration"),
    callbackSource: pickString(body, "CallbackSource"),
    parentCallSid: pickString(body, "ParentCallSid"),
    sequenceNumber: pickInt(body, "SequenceNumber"),
    contactId: pickString(body, "contactId", "ContactId"),
    conversationId: pickString(body, "conversationId", "ConversationId"),
    callType: pickString(body, "callType", "CallType"),
    answeredAt: null,
    completedAt: null,
    ringDurationSec: null,
    childCallSid: null,
    childFrom: null,
    recordingSid: null,
    recordingUrl: null,
  };

  if (isAnsweredStatus(status) && eventTimestamp) {
    payload.answeredAt = eventTimestamp;
  }

  if (isCompletedStatus(status) && eventTimestamp) {
    payload.completedAt = eventTimestamp;
  }

  return payload;
}

function applyEnrichment(payload, enriched) {
  if (!enriched) return payload;

  const merged = { ...payload };

  for (const [key, value] of Object.entries(enriched)) {
    if (value === null || value === undefined || value === "") continue;
    if (merged[key] == null || merged[key] === "") {
      merged[key] = value;
    }
  }

  if (merged.durationSec == null && enriched.durationSec != null) {
    merged.durationSec = enriched.durationSec;
  }

  if (merged.answeredAt == null && enriched.answeredAt != null) {
    merged.answeredAt = enriched.answeredAt;
  }

  if (merged.completedAt == null && enriched.completedAt != null) {
    merged.completedAt = enriched.completedAt;
  }

  if (merged.ringDurationSec == null && enriched.ringDurationSec != null) {
    merged.ringDurationSec = enriched.ringDurationSec;
  }

  return merged;
}

async function upsertCallDocument(payload) {
  let enriched = payload;
  const parties = resolveCallParties(payload);
  if (parties.businessLineE164) {
    const partiesWithOrg = await attachOrgSlug(parties);
    if (partiesWithOrg.orgSlug) {
      enriched = { ...payload, orgSlug: partiesWithOrg.orgSlug };
    }
  }
  return callRepository.upsert(enriched.callSid, enriched);
}

async function handleTwilioCallWebhook(req, res) {
  try {
    if (!validateTwilioRequest(req)) {
      return res.status(403).json({ ok: false, error: "invalid_twilio_signature" });
    }

    const db = getFirestore();
    const callSid = pickString(req.body, "CallSid");
    const existingSnap = callSid
      ? await db.collection("calls").doc(callSid).get()
      : null;
    const existingDoc = existingSnap && existingSnap.exists ? existingSnap.data() : null;

    let payload = mapTwilioCallPayload(req.body, existingDoc);

    if (isCompletedStatus(payload.status)) {
      try {
        const enriched = await enrichCallOnCompleted(
          payload.callSid,
          payload.accountSid,
        );
        payload = applyEnrichment(payload, enriched);
      } catch (enrichError) {
        console.warn(
          "[webhook/twilio/calls] enrichment failed:",
          enrichError.message || enrichError,
        );
      }
    }

    if (isCompletedStatus(payload.status)) {
      let linkResult = null;
      try {
        linkResult = await callLinkService.linkCompletedCall(payload);
      } catch (linkError) {
        console.warn(
          "[webhook/twilio/calls] call linking failed:",
          linkError.message || linkError,
        );
        const result = await upsertCallDocument(payload);
        return res.status(200).json({
          ok: true,
          callSid: result.id,
          created: result.created,
          linked: false,
        });
      }

      if (!linkResult.linked) {
        const result = await upsertCallDocument(payload);
        return res.status(200).json({
          ok: true,
          callSid: result.id,
          created: result.created,
          linked: false,
          reason: linkResult.reason || null,
        });
      }

      return res.status(200).json({
        ok: true,
        callSid: payload.callSid,
        linked: true,
        contactId: linkResult.contactId,
        conversationId: linkResult.conversationId,
        communicationId: linkResult.communicationId,
      });
    }

    const result = await upsertCallDocument(payload);
    return res.status(200).json({
      ok: true,
      callSid: result.id,
      created: result.created,
    });
  } catch (error) {
    const status = error.status || 500;
    console.error("[webhook/twilio/calls]", error.message || error);
    return res.status(status).json({
      ok: false,
      error: error.message || "internal_error",
    });
  }
}

module.exports = {
  handleTwilioCallWebhook,
  mapTwilioCallPayload,
  upsertCallDocument,
  applyEnrichment,
};
