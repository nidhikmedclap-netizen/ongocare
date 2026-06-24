const { randomUUID } = require("crypto");
const { FieldValue } = require("firebase-admin/firestore");
const ChatSiteRepository = require("../repositories/ChatSiteRepository");
const ChatVisitorRepository = require("../repositories/ChatVisitorRepository");
const { isOriginAllowedForSite, publicSiteConfig } = require("../lib/chatSiteOrigin");
const { buildAnalyticsContext, clientIp } = require("../lib/chatRequestContext");
const { buildVisitorFingerprint } = require("../lib/chatVisitorFingerprint");
const { signVisitorToken } = require("../lib/chatVisitorToken");
const { normalizeVisitorId } = require("../models/ChatVisitor");
const { normalizeSiteKey } = require("../models/ChatSite");

class ChatBootstrapService {
  constructor(deps = {}) {
    this.siteRepo = deps.siteRepo || new ChatSiteRepository();
    this.visitorRepo = deps.visitorRepo || new ChatVisitorRepository();
  }

  async bootstrap({ body, req }) {
    const siteKey = normalizeSiteKey(body.siteKey);
    if (!siteKey) {
      const error = new Error("invalid_site_key");
      error.status = 400;
      throw error;
    }

    const site = await this.siteRepo.getBySiteKey(siteKey);
    if (!site || site.status !== "active") {
      const error = new Error("site_not_found");
      error.status = 404;
      throw error;
    }

    if (!isOriginAllowedForSite(site, req)) {
      const error = new Error("origin_not_allowed");
      error.status = 403;
      throw error;
    }

    const context = buildAnalyticsContext({ siteKey, body, req });
    const requestedVisitorId = normalizeVisitorId(body.visitorId);
    const existing = requestedVisitorId
      ? await this.visitorRepo.getById(requestedVisitorId)
      : null;

    const visitorId = existing?.visitorId || randomUUID();
    const fingerprint = buildVisitorFingerprint({
      anonymousId: existing?.fingerprint?.anonymousId || visitorId,
      userAgent: req.get("user-agent"),
      ip: clientIp(req),
      existingFingerprint: existing?.fingerprint || null,
    });

    await this.visitorRepo.upsert(visitorId, {
      orgSlug: site.orgSlug,
      siteKey,
      fingerprint,
      existingFingerprint: existing?.fingerprint || null,
      firstContext: existing?.firstContext || context,
      lastContext: context,
      lastSeenAt: FieldValue.serverTimestamp(),
    });

    const visitorToken = signVisitorToken({
      role: "chat_visitor",
      visitorId,
      siteKey,
      orgSlug: site.orgSlug,
    });

    return {
      visitorId,
      visitorToken,
      site: publicSiteConfig(site),
    };
  }
}

module.exports = ChatBootstrapService;
