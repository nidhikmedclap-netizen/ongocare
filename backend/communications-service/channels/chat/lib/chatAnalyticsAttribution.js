function normalizePageUrl(value) {
  const text = String(value || "").trim();
  if (!text) return null;
  try {
    const url = new URL(text);
    return `${url.origin}${url.pathname}`;
  } catch {
    return text.slice(0, 512);
  }
}

function normalizeReferrer(value) {
  const text = String(value || "").trim();
  if (!text) return null;
  try {
    return new URL(text).hostname.toLowerCase();
  } catch {
    return text.slice(0, 256);
  }
}

function normalizeUtmValue(value) {
  const text = String(value || "").trim();
  return text || null;
}

function attributionFromSession(session) {
  const context = session.context || {};
  const utm = context.utm || {};
  return {
    siteKey: session.siteKey || context.siteKey || null,
    pageUrl: normalizePageUrl(context.pageUrl),
    referrer: normalizeReferrer(context.referrer),
    utm: {
      source: normalizeUtmValue(utm.source),
      medium: normalizeUtmValue(utm.medium),
      campaign: normalizeUtmValue(utm.campaign),
    },
  };
}

function attributionFromVisitor(visitor) {
  const context = visitor.firstContext || visitor.lastContext || {};
  const utm = context.utm || {};
  return {
    siteKey: visitor.siteKey || context.siteKey || null,
    pageUrl: normalizePageUrl(context.pageUrl),
    referrer: normalizeReferrer(context.referrer),
    utm: {
      source: normalizeUtmValue(utm.source),
      medium: normalizeUtmValue(utm.medium),
      campaign: normalizeUtmValue(utm.campaign),
    },
  };
}

function buildAttributionKey(attribution) {
  return [
    attribution.siteKey || "",
    attribution.pageUrl || "",
    attribution.referrer || "",
    attribution.utm.source || "",
    attribution.utm.medium || "",
    attribution.utm.campaign || "",
  ].join("|");
}

function createAttributionBucket(attribution, orgSlug) {
  return {
    orgSlug,
    siteKey: attribution.siteKey,
    pageUrl: attribution.pageUrl,
    referrer: attribution.referrer,
    utm: { ...attribution.utm },
    visitors: 0,
    sessions: 0,
    conversations: 0,
    messages: 0,
    leads: 0,
    visitorIds: new Set(),
    sessionIds: new Set(),
    conversationIds: new Set(),
  };
}

function finalizeAttributionBucket(bucket) {
  return {
    orgSlug: bucket.orgSlug,
    siteKey: bucket.siteKey,
    pageUrl: bucket.pageUrl,
    referrer: bucket.referrer,
    utm: bucket.utm,
    visitors: bucket.visitorIds.size,
    sessions: bucket.sessionIds.size,
    conversations: bucket.conversationIds.size,
    messages: bucket.messages,
    leads: bucket.leads,
  };
}

function createSiteBucket(siteKey, orgSlug) {
  return {
    orgSlug,
    siteKey,
    visitors: 0,
    sessions: 0,
    conversations: 0,
    messages: 0,
    leads: 0,
    visitorIds: new Set(),
    sessionIds: new Set(),
    conversationIds: new Set(),
  };
}

function finalizeSiteBucket(bucket) {
  return {
    orgSlug: bucket.orgSlug,
    siteKey: bucket.siteKey,
    visitors: bucket.visitorIds.size,
    sessions: bucket.sessionIds.size,
    conversations: bucket.conversationIds.size,
    messages: bucket.messages,
    leads: bucket.leads,
  };
}

module.exports = {
  attributionFromSession,
  attributionFromVisitor,
  buildAttributionKey,
  createAttributionBucket,
  finalizeAttributionBucket,
  createSiteBucket,
  finalizeSiteBucket,
  normalizePageUrl,
  normalizeReferrer,
};
