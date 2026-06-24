const twilio = require("twilio");
const { Timestamp } = require("firebase-admin/firestore");
const { parseTwilioTimestamp, secondsBetween } = require("./twilioParse");

function getTwilioClient(accountSid) {
  const authToken = (process.env.TWILIO_AUTH_TOKEN || "").trim();
  if (!authToken) {
    throw new Error("TWILIO_AUTH_TOKEN is not set");
  }
  const sid = (accountSid || process.env.TWILIO_ACCOUNT_SID || "").trim();
  if (!sid) {
    throw new Error("Twilio account SID is required for enrichment");
  }
  return twilio(sid, authToken);
}

function parseCallResource(call) {
  if (!call) return {};
  return {
    callSid: call.sid || null,
    to: (call.to && String(call.to).trim()) || null,
    from: (call.from && String(call.from).trim()) || null,
    callerName: (call.callerName && String(call.callerName).trim()) || null,
    parentCallSid: (call.parentCallSid && String(call.parentCallSid).trim()) || null,
    durationSec:
      call.duration != null && String(call.duration).trim() !== ""
        ? parseInt(String(call.duration), 10) || null
        : null,
    answeredAt: call.startTime ? parseTwilioTimestamp(call.startTime) : null,
    completedAt: call.endTime ? parseTwilioTimestamp(call.endTime) : null,
    createdAt: call.dateCreated ? parseTwilioTimestamp(call.dateCreated) : null,
  };
}

async function fetchChildLeg(client, parentCallSid) {
  const legs = await client.calls.list({
    parentCallSid,
    limit: 5,
  });
  if (!legs.length) return null;
  return parseCallResource(legs[0]);
}

async function fetchRecordings(client, callSid) {
  const recordings = await client.calls(callSid).recordings.list({ limit: 5 });
  if (!recordings.length) {
    return { recordingSid: null, recordingUrl: null };
  }
  const rec = recordings[0];
  const recordingSid = rec.sid || null;
  const recordingUrl = recordingSid
    ? `https://api.twilio.com/2010-04-01/Accounts/${rec.accountSid}/Recordings/${recordingSid}.mp3`
    : null;
  return { recordingSid, recordingUrl };
}

/**
 * REST enrichment on completed status callbacks.
 * Failures are non-fatal — caller should log and continue with webhook-only fields.
 */
async function enrichCallOnCompleted(callSid, accountSid) {
  const client = getTwilioClient(accountSid);
  const [parentCall, childLeg, recordings] = await Promise.all([
    client.calls(callSid).fetch().then(parseCallResource).catch(() => ({})),
    fetchChildLeg(client, callSid).catch(() => null),
    fetchRecordings(client, callSid).catch(() => ({
      recordingSid: null,
      recordingUrl: null,
    })),
  ]);

  const enriched = {
    childCallSid: childLeg?.callSid || null,
    childFrom: childLeg?.from || null,
    to: childLeg?.to || parentCall.to || null,
    callerName: parentCall.callerName || childLeg?.callerName || null,
    parentCallSid: parentCall.parentCallSid || null,
    recordingSid: recordings.recordingSid,
    recordingUrl: recordings.recordingUrl,
    durationSec: parentCall.durationSec || childLeg?.durationSec || null,
    answeredAt: childLeg?.answeredAt || parentCall.answeredAt || null,
    completedAt: parentCall.completedAt || null,
    ringDurationSec: null,
  };

  if (parentCall.answeredAt && childLeg?.answeredAt) {
    enriched.ringDurationSec = secondsBetween(
      parentCall.answeredAt,
      childLeg.answeredAt,
    );
  } else if (parentCall.createdAt && childLeg?.answeredAt) {
    enriched.ringDurationSec = secondsBetween(
      parentCall.createdAt,
      childLeg.answeredAt,
    );
  }

  return enriched;
}

module.exports = {
  enrichCallOnCompleted,
  getTwilioClient,
};
