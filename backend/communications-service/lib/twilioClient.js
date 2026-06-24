const twilio = require("twilio");

function getTwilioRestClient(accountSid) {
  const sid = (accountSid || process.env.TWILIO_ACCOUNT_SID || "").trim();
  if (!sid) {
    throw new Error("TWILIO_ACCOUNT_SID is not set");
  }

  const apiKeySid = (process.env.TWILIO_API_KEY_SID || "").trim();
  const apiKeySecret = (process.env.TWILIO_API_KEY_SECRET || "").trim();
  if (apiKeySid && apiKeySecret) {
    return twilio(apiKeySid, apiKeySecret, { accountSid: sid });
  }

  const authToken = (process.env.TWILIO_AUTH_TOKEN || "").trim();
  if (!authToken) {
    throw new Error("TWILIO_AUTH_TOKEN or API key credentials are required");
  }

  return twilio(sid, authToken);
}

function smsStatusCallbackUrl() {
  const base = (process.env.COMMUNICATIONS_PUBLIC_URL || "").trim().replace(/\/$/, "");
  if (!base) {
    throw new Error("COMMUNICATIONS_PUBLIC_URL is not set");
  }
  return `${base}/webhooks/twilio/sms/status`;
}

module.exports = {
  getTwilioRestClient,
  smsStatusCallbackUrl,
};
