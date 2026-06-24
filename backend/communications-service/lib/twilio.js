const twilio = require("twilio");

function publicWebhookUrl(req) {
  const base = (process.env.COMMUNICATIONS_PUBLIC_URL || "").trim().replace(/\/$/, "");
  if (!base) {
    throw new Error("COMMUNICATIONS_PUBLIC_URL is not set");
  }
  return `${base}${req.originalUrl}`;
}

function validateTwilioRequest(req) {
  const authToken = (process.env.TWILIO_AUTH_TOKEN || "").trim();
  if (!authToken) {
    throw new Error("TWILIO_AUTH_TOKEN is not set");
  }

  const signature = req.get("X-Twilio-Signature") || "";
  const url = publicWebhookUrl(req);

  return twilio.validateRequest(authToken, signature, url, req.body || {});
}

module.exports = {
  publicWebhookUrl,
  validateTwilioRequest,
};
