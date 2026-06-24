const { FieldValue } = require("firebase-admin/firestore");
const { normalizeE164 } = require("../lib/phoneE164");
const { normalizeOrgSlug } = require("../lib/orgSlug");

function buildOrgPhoneNumberDocument(input = {}) {
  const e164 = normalizeE164(input.e164);
  const orgSlug = normalizeOrgSlug(input.orgSlug);
  if (!e164) {
    throw new Error("e164 is required for orgPhoneNumber");
  }
  if (!orgSlug) {
    throw new Error("orgSlug is required for orgPhoneNumber");
  }

  return {
    e164,
    orgSlug,
    channel: input.channel || "sms_voice",
    label: input.label ? String(input.label).trim() : null,
    status: input.status || "active",
    isDefault: Boolean(input.isDefault),
    twilioPhoneNumberSid: input.twilioPhoneNumberSid || null,
    twilioMessagingServiceSid: input.twilioMessagingServiceSid || null,
    createdAt: input.createdAt || FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
}

module.exports = {
  buildOrgPhoneNumberDocument,
};
