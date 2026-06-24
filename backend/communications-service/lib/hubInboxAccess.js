const { normalizeOrgSlug } = require("./orgSlug");
const { isHubAuthStrict } = require("./hubAuthConfig");
const { logHubAuthShadow, logHubAuthStrict } = require("./hubAuthLog");

function normalizeAllowedOrgSlugs(values) {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.map((slug) => normalizeOrgSlug(slug)).filter(Boolean))];
}

function getInboxOrgScope(req) {
  const allowedOrgSlugs = normalizeAllowedOrgSlugs(req.allowedOrgSlugs);
  return {
    isSuperAdmin: !!req.isSuperAdmin,
    allowedOrgSlugs,
    strict: isHubAuthStrict(),
    path: req.originalUrl || req.url || req.path,
    uid: req.firebaseUser?.uid || null,
    hubAuthType: req.hubAuthType || null,
  };
}

function getInboxOrgFilter(scope) {
  if (scope.isSuperAdmin) return null;
  if (scope.allowedOrgSlugs.length) return scope.allowedOrgSlugs;
  return null;
}

function conversationOrgSlug(conversation) {
  return normalizeOrgSlug(conversation?.orgSlug);
}

function isConversationInOrgScope(conversation, scope) {
  if (scope.isSuperAdmin) return true;
  if (!scope.allowedOrgSlugs.length) return true;

  const orgSlug = conversationOrgSlug(conversation);
  if (!orgSlug) return false;
  return scope.allowedOrgSlugs.includes(orgSlug);
}

function checkConversationOrgAccess(conversation, scope) {
  if (isConversationInOrgScope(conversation, scope)) {
    return { allowed: true };
  }

  logHubAuthShadow("would_deny", {
    uid: scope.uid,
    authType: scope.hubAuthType,
    path: scope.path,
    strict: scope.strict,
    reason: "conversation_org_forbidden",
    conversationId: conversation?.id || null,
    conversationOrgSlug: conversationOrgSlug(conversation),
    allowedOrgSlugs: scope.allowedOrgSlugs,
  });

  if (scope.strict) {
    logHubAuthStrict("request_denied", {
      uid: scope.uid,
      authType: scope.hubAuthType,
      path: scope.path,
      reason: "conversation_org_forbidden",
      conversationId: conversation?.id || null,
    });
    return {
      allowed: false,
      status: 403,
      body: {
        ok: false,
        error: "hub_forbidden",
        message: "Conversation is outside allowed organization scope.",
      },
    };
  }

  return { allowed: true };
}

module.exports = {
  getInboxOrgScope,
  getInboxOrgFilter,
  isConversationInOrgScope,
  checkConversationOrgAccess,
};
