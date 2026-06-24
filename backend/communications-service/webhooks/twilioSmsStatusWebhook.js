const { validateTwilioRequest } = require("../lib/twilio");
const { mapTwilioSmsStatusPayload } = require("../lib/twilioSmsParse");
const { SmsLinkService } = require("../services/SmsLinkService");

const smsLinkService = new SmsLinkService();

async function handleTwilioSmsStatusWebhook(req, res) {
  try {
    if (!validateTwilioRequest(req)) {
      return res.status(403).json({ ok: false, error: "invalid_twilio_signature" });
    }

    const statusPayload = mapTwilioSmsStatusPayload(req.body);
    const result = await smsLinkService.updateDeliveryStatus(statusPayload);

    return res.status(200).json({
      ok: true,
      messageSid: statusPayload.messageSid,
      updated: result.updated,
      duplicate: result.duplicate || false,
      reason: result.reason || null,
      status: result.status || statusPayload.status,
    });
  } catch (error) {
    const status = error.status || 500;
    console.error("[webhook/twilio/sms/status]", error.message || error);
    return res.status(status).json({
      ok: false,
      error: error.message || "internal_error",
    });
  }
}

module.exports = {
  handleTwilioSmsStatusWebhook,
};
