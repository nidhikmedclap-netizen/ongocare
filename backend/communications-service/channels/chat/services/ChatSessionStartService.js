const { randomUUID } = require("crypto");
const ChatSiteRepository = require("../repositories/ChatSiteRepository");
const ChatVisitorRepository = require("../repositories/ChatVisitorRepository");
const { isOriginAllowedForSite } = require("../lib/chatSiteOrigin");
const { startChatSessionInTransaction } = require("../lib/chatSessionLinkTransaction");
const { normalizeSiteKey } = require("../models/ChatSite");
const { normalizeVisitorId } = require("../models/ChatVisitor");

class ChatSessionStartService {
  constructor(deps = {}) {
    this.siteRepo = deps.siteRepo || new ChatSiteRepository();
    this.visitorRepo = deps.visitorRepo || new ChatVisitorRepository();
  }

  async startSession({ body, req, tokenClaims }) {
    const siteKey = normalizeSiteKey(body.siteKey);
    const visitorId = normalizeVisitorId(body.visitorId);

    if (!siteKey || !visitorId) {
      const error = new Error("invalid_session_request");
      error.status = 400;
      throw error;
    }

    if (tokenClaims.visitorId !== visitorId || tokenClaims.siteKey !== siteKey) {
      const error = new Error("visitor_token_mismatch");
      error.status = 403;
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

    const visitor = await this.visitorRepo.getById(visitorId);
    if (!visitor || visitor.status !== "active") {
      const error = new Error("visitor_not_found");
      error.status = 404;
      throw error;
    }

    if (visitor.siteKey !== siteKey || visitor.orgSlug !== site.orgSlug) {
      const error = new Error("visitor_site_mismatch");
      error.status = 403;
      throw error;
    }

    const sessionId = randomUUID();
    const context = visitor.lastContext || visitor.firstContext || {
      siteKey,
      pageUrl: null,
      pageTitle: null,
      referrer: null,
      utm: {},
    };

    const result = await startChatSessionInTransaction({
      sessionId,
      site,
      visitor,
      context: {
        ...context,
        siteKey,
      },
    });

    return {
      sessionId: result.sessionId,
      conversationId: result.conversationId,
      contactId: result.contactId,
      orgSlug: result.orgSlug,
      siteKey: result.siteKey,
      visitorId: result.visitorId,
    };
  }
}

module.exports = ChatSessionStartService;
