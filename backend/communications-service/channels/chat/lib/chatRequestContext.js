const { FieldValue } = require("firebase-admin/firestore");
const { defaultSessionContext } = require("./chatDefaults");

function normalizeUtm(input = {}) {
  if (!input || typeof input !== "object") return {};
  return {
    source: input.source ? String(input.source).trim() : null,
    medium: input.medium ? String(input.medium).trim() : null,
    campaign: input.campaign ? String(input.campaign).trim() : null,
    term: input.term ? String(input.term).trim() : null,
    content: input.content ? String(input.content).trim() : null,
  };
}

function buildAnalyticsContext({ siteKey, body = {}, req }) {
  return defaultSessionContext({
    siteKey,
    pageUrl: body.pageUrl,
    pageTitle: body.pageTitle,
    referrer: body.referrer || req.get("referer") || null,
    locale: body.locale || req.get("accept-language")?.split(",")[0] || null,
    userAgent: req.get("user-agent") || null,
    utm: normalizeUtm(body.utm),
    updatedAt: FieldValue.serverTimestamp(),
  });
}

function clientIp(req) {
  const forwarded = req.get("x-forwarded-for");
  if (forwarded) {
    return String(forwarded).split(",")[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || "";
}

module.exports = {
  normalizeUtm,
  buildAnalyticsContext,
  clientIp,
};
