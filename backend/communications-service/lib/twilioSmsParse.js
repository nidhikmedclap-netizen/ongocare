const { pickString, pickInt, parseTwilioTimestamp } = require("./twilioParse");

function mapTwilioInboundSmsPayload(body) {
  const messageSid = pickString(body, "MessageSid", "SmsSid");
  if (!messageSid) {
    const error = new Error("MessageSid is required");
    error.status = 400;
    throw error;
  }

  const numMedia = pickInt(body, "NumMedia") ?? 0;

  return {
    messageSid,
    accountSid: pickString(body, "AccountSid"),
    messagingServiceSid: pickString(body, "MessagingServiceSid"),
    from: pickString(body, "From"),
    to: pickString(body, "To"),
    body: pickString(body, "Body") || "",
    numSegments: pickInt(body, "NumSegments"),
    numMedia,
    status: "received",
    direction: "inbound",
    occurredAt:
      parseTwilioTimestamp(pickString(body, "DateSent")) ||
      parseTwilioTimestamp(pickString(body, "Timestamp")),
  };
}

const SUPPORTED_DELIVERY_STATUSES = new Set([
  "queued",
  "sent",
  "delivered",
  "failed",
  "undelivered",
]);

function mapTwilioSmsStatusPayload(body) {
  const messageSid = pickString(body, "MessageSid", "SmsSid");
  if (!messageSid) {
    const error = new Error("MessageSid is required");
    error.status = 400;
    throw error;
  }

  const rawStatus = pickString(body, "MessageStatus", "SmsStatus", "Status");
  const status = rawStatus ? rawStatus.toLowerCase() : null;
  if (!status || !SUPPORTED_DELIVERY_STATUSES.has(status)) {
    const error = new Error(`Unsupported or missing MessageStatus: ${rawStatus || "(empty)"}`);
    error.status = 400;
    throw error;
  }

  const errorCodeRaw = pickString(body, "ErrorCode");
  const errorCode = errorCodeRaw != null ? pickInt(body, "ErrorCode") : null;

  return {
    messageSid,
    status,
    errorCode,
    errorMessage: pickString(body, "ErrorMessage"),
    accountSid: pickString(body, "AccountSid"),
    messagingServiceSid: pickString(body, "MessagingServiceSid"),
    from: pickString(body, "From"),
    to: pickString(body, "To"),
    occurredAt:
      parseTwilioTimestamp(pickString(body, "DateSent")) ||
      parseTwilioTimestamp(pickString(body, "Timestamp")),
  };
}

module.exports = {
  mapTwilioInboundSmsPayload,
  mapTwilioSmsStatusPayload,
  SUPPORTED_DELIVERY_STATUSES,
};
