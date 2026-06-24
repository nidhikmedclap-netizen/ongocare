const crypto = require("crypto");
const { randomUUID } = require("crypto");

function hashValue(value) {
  const text = String(value || "").trim();
  if (!text) return null;
  return crypto.createHash("sha256").update(text).digest("hex").slice(0, 32);
}

function buildVisitorFingerprint({ anonymousId, userAgent, ip, existingFingerprint = null }) {
  const resolvedAnonymousId =
    String(anonymousId || existingFingerprint?.anonymousId || "").trim() || randomUUID();

  const userAgentHash = hashValue(userAgent);
  const ipHash = hashValue(ip);

  return {
    anonymousId: resolvedAnonymousId,
    userAgentHash: userAgentHash || existingFingerprint?.userAgentHash || null,
    firstSeenIpHash: existingFingerprint?.firstSeenIpHash || ipHash || null,
  };
}

module.exports = {
  hashValue,
  buildVisitorFingerprint,
};
