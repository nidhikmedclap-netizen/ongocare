const { normalizeE164 } = require("./phoneE164");

function buildOrgPhoneNumberDocId(e164) {
  const normalized = normalizeE164(e164);
  if (!normalized) return null;
  return normalized.replace(/\//g, "_");
}

module.exports = {
  buildOrgPhoneNumberDocId,
};
