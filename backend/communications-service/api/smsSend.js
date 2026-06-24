const { getTwilioRestClient, smsStatusCallbackUrl } = require("../lib/twilioClient");
const { normalizeE164 } = require("../lib/phoneE164");
const { SmsLinkService } = require("../services/SmsLinkService");

const smsLinkService = new SmsLinkService();
const MAX_SMS_BODY_LENGTH = 1600;

function pickMessageField(body, key) {
  const value = body && body[key];
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

function resolveFromNumber(body) {
  const explicit = pickMessageField(body, "from");
  if (explicit) {
    return normalizeE164(explicit);
  }

  const configured = (process.env.TWILIO_SMS_FROM_NUMBER || "").trim();
  return normalizeE164(configured);
}

async function handleSmsSend(req, res) {
  try {
    const toE164 = normalizeE164(pickMessageField(req.body, "to"));
    const messageBody = pickMessageField(req.body, "body");

    if (!toE164) {
      return res.status(400).json({
        ok: false,
        error: "invalid_to",
        message: "Use E.164, e.g. +15551234567",
      });
    }

    if (!messageBody || messageBody.length > MAX_SMS_BODY_LENGTH) {
      return res.status(400).json({
        ok: false,
        error: "invalid_body",
        message: "Body must be 1–1600 characters",
      });
    }

    const client = getTwilioRestClient();
    const messagingServiceSid = (process.env.TWILIO_MESSAGING_SERVICE_SID || "").trim();
    const fromE164 = resolveFromNumber(req.body);

    const createOptions = {
      to: toE164,
      body: messageBody,
      statusCallback: smsStatusCallbackUrl(),
      statusCallbackMethod: "POST",
    };

    if (messagingServiceSid) {
      createOptions.messagingServiceSid = messagingServiceSid;
    } else {
      if (!fromE164) {
        return res.status(500).json({
          ok: false,
          error: "server_config",
          message:
            "Set TWILIO_MESSAGING_SERVICE_SID or TWILIO_SMS_FROM_NUMBER (E.164), or pass from in the request body",
        });
      }
      createOptions.from = fromE164;
    }

    const created = await client.messages.create(createOptions);
    const resolvedFrom = normalizeE164(created.from) || fromE164;
    const resolvedTo = normalizeE164(created.to) || toE164;

    const linkResult = await smsLinkService.linkOutboundSms({
      messageSid: created.sid,
      accountSid: created.accountSid || null,
      messagingServiceSid: created.messagingServiceSid || messagingServiceSid || null,
      from: resolvedFrom,
      to: resolvedTo,
      body: created.body || messageBody,
      status: created.status || "queued",
      numSegments: created.numSegments != null ? Number(created.numSegments) : null,
      occurredAt: created.dateCreated ? new Date(created.dateCreated) : undefined,
    });

    return res.status(200).json({
      ok: true,
      sid: created.sid,
      status: created.status,
      to: resolvedTo,
      from: resolvedFrom,
      linked: linkResult.linked,
      duplicate: linkResult.duplicate || false,
      contactId: linkResult.contactId || null,
      conversationId: linkResult.conversationId || null,
      communicationId: linkResult.communicationId || null,
      statusCallback: createOptions.statusCallback,
    });
  } catch (error) {
    console.error("[api/sms/send]", error.message || error);
    const status = error.status || 502;
    return res.status(status).json({
      ok: false,
      error: error.code || "twilio_error",
      message: error.message || "Failed to send SMS",
    });
  }
}

module.exports = {
  handleSmsSend,
};
