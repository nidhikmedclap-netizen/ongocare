const DEFAULT_COUNTRY_CODE =
  (process.env.DEFAULT_PHONE_COUNTRY_CODE || "1").replace(/\D/g, "") || "1";

function normalizeE164(raw, defaultCountryCode = DEFAULT_COUNTRY_CODE) {
  const trimmed = String(raw || "").trim();
  if (!trimmed || trimmed.startsWith("client:")) return null;

  let digits = trimmed.replace(/\D/g, "");
  if (trimmed.startsWith("+")) {
    return digits ? `+${digits}` : null;
  }
  if (digits.length === 10) {
    digits = `${defaultCountryCode}${digits}`;
  }
  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }
  return digits ? `+${digits}` : null;
}

function digitsOnly(e164) {
  return String(e164 || "").replace(/\D/g, "");
}

function sameNumber(a, b) {
  const da = digitsOnly(normalizeE164(a));
  const db = digitsOnly(normalizeE164(b));
  if (!da || !db) return false;
  if (da === db) return true;
  if (da.length === 10 && db.length === 11 && db.startsWith("1") && db.slice(1) === da) {
    return true;
  }
  if (db.length === 10 && da.length === 11 && da.startsWith("1") && da.slice(1) === db) {
    return true;
  }
  return false;
}

function buildConversationKey(peerE164, businessLineE164) {
  const peer = normalizeE164(peerE164);
  const line = normalizeE164(businessLineE164);
  if (!peer || !line) return null;
  return `${peer}_${line}`.replace(/\//g, "_");
}

function buildContactKey(e164) {
  const normalized = normalizeE164(e164);
  if (!normalized) return null;
  return normalized.replace(/\//g, "_");
}

module.exports = {
  normalizeE164,
  digitsOnly,
  sameNumber,
  buildConversationKey,
  buildContactKey,
};
