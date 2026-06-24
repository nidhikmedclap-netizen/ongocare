function parseHostname(value) {
  const text = String(value || "").trim();
  if (!text) return null;

  try {
    if (text.includes("://")) {
      return new URL(text).hostname.toLowerCase();
    }
    return new URL(`https://${text}`).hostname.toLowerCase();
  } catch (error) {
    return null;
  }
}

function requestOriginHost(req) {
  const originHost = parseHostname(req.get("origin"));
  if (originHost) return originHost;

  const refererHost = parseHostname(req.get("referer"));
  if (refererHost) return refererHost;

  return null;
}

function domainMatches(host, pattern) {
  const normalizedHost = parseHostname(host);
  const normalizedPattern = parseHostname(pattern);
  if (!normalizedHost || !normalizedPattern) return false;

  if (normalizedPattern.startsWith("*.")) {
    const suffix = normalizedPattern.slice(1);
    return normalizedHost === normalizedPattern.slice(2) || normalizedHost.endsWith(suffix);
  }

  return normalizedHost === normalizedPattern;
}

function isOriginBypassEnabled() {
  const raw = String(process.env.CHAT_ORIGIN_BYPASS || "").trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes";
}

function isOriginAllowedForSite(site, req) {
  if (isOriginBypassEnabled()) return true;

  const domains = Array.isArray(site?.domains) ? site.domains : [];
  if (!domains.length) return false;

  const host = requestOriginHost(req);
  if (!host) return false;

  return domains.some((pattern) => domainMatches(host, pattern));
}

function publicSiteConfig(site) {
  return {
    siteKey: site.siteKey,
    orgSlug: site.orgSlug,
    name: site.name,
    theme: site.theme || {},
    preChatForm: site.preChatForm || {},
    businessHours: site.businessHours || {},
    offlineMessage: site.offlineMessage || null,
    routing: site.routing || {},
    ai: {
      enabled: Boolean(site.ai?.enabled),
      defaultMode: site.ai?.defaultMode || "off",
    },
  };
}

module.exports = {
  parseHostname,
  requestOriginHost,
  domainMatches,
  isOriginAllowedForSite,
  isOriginBypassEnabled,
  publicSiteConfig,
};
