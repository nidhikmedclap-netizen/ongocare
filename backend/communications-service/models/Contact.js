const { FieldValue } = require("firebase-admin/firestore");
const { normalizeE164 } = require("../lib/phoneE164");

function buildDisplayName({ displayName, firstName, lastName }) {
  if (displayName && String(displayName).trim()) return String(displayName).trim();
  const parts = [firstName, lastName].map((v) => (v && String(v).trim()) || "").filter(Boolean);
  return parts.join(" ") || null;
}

function buildPhoneEntry(number, kind = "mobile", isPrimary = true) {
  const e164 = normalizeE164(number);
  if (!e164) return null;
  return {
    kind,
    number: String(number).trim(),
    e164,
    isPrimary,
  };
}

function buildContactDocument(input = {}) {
  const phones = (input.phones || [])
    .map((p) =>
      buildPhoneEntry(p.number || p.e164, p.kind || "mobile", Boolean(p.isPrimary)),
    )
    .filter(Boolean);

  if (!phones.length && input.phone) {
    const entry = buildPhoneEntry(input.phone, "mobile", true);
    if (entry) phones.push(entry);
  }

  const phonesE164 = [...new Set(phones.map((p) => p.e164))];
  const displayName = buildDisplayName(input) || phonesE164[0] || "Unknown";
  const smsAt = input.lastSmsAt || input.smsActivityAt || null;
  const callAt = input.lastCallAt || input.callActivityAt || null;
  const chatAt = input.lastChatAt || input.chatActivityAt || null;
  const activityAt = input.lastActivityAt || smsAt || callAt || chatAt || null;

  const visitorIds = Array.isArray(input.visitorIds)
    ? [...new Set(input.visitorIds.map((value) => String(value).trim()).filter(Boolean))]
    : [];

  const document = {
    displayName,
    firstName: input.firstName || null,
    lastName: input.lastName || null,
    company: input.company || null,
    email: input.email || null,
    phones,
    phonesE164,
    visitorIds,
    source: input.source || "twilio",
    tags: input.tags || [],
    notes: input.notes || null,
    lead: input.lead && typeof input.lead === "object" ? input.lead : null,
    createdAt: input.createdAt || FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (smsAt != null) {
    document.lastSmsAt = smsAt;
  }

  if (callAt != null) {
    document.lastCallAt = callAt;
  }

  if (chatAt != null) {
    document.lastChatAt = chatAt;
  }

  if (activityAt != null) {
    document.lastActivityAt = activityAt;
  }

  return document;
}

module.exports = {
  buildContactDocument,
  buildDisplayName,
  buildPhoneEntry,
};
