const twilio = require("twilio");
const { validateTwilioRequest } = require("../lib/twilio");
const { mapTwilioInboundSmsPayload } = require("../lib/twilioSmsParse");
const { SmsLinkService } = require("../services/SmsLinkService");

const smsLinkService = new SmsLinkService();
const { MessagingResponse } = twilio.twiml;

async function handleTwilioSmsInboundWebhook(req, res) {
  try {
    if (!validateTwilioRequest(req)) {
      return res.status(403).json({ ok: false, error: "invalid_twilio_signature" });
    }

    const smsPayload = mapTwilioInboundSmsPayload(req.body);
    const linkResult = await smsLinkService.linkInboundSms(smsPayload);

    if (!linkResult.linked) {
      console.warn("[webhook/twilio/sms/inbound] linking skipped:", linkResult.reason, {
        messageSid: smsPayload.messageSid,
        parties: linkResult.parties,
      });
    }

    const twiml = new MessagingResponse();
    return res.type("text/xml").status(200).send(twiml.toString());
  } catch (error) {
    const status = error.status || 500;
    console.error("[webhook/twilio/sms/inbound]", error.message || error);
    if (status >= 500) {
      return res.status(status).json({
        ok: false,
        error: error.message || "internal_error",
      });
    }
    const twiml = new MessagingResponse();
    return res.type("text/xml").status(200).send(twiml.toString());
  }
}

module.exports = {
  handleTwilioSmsInboundWebhook,
};
