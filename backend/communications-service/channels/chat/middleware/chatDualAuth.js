const { bearerFromRequest, checkAppAuth } = require("../../../lib/appAuth");
const { resolveOrgAccess } = require("../../../lib/resolveOrgAccess");
const { verifyVisitorToken } = require("../lib/chatVisitorToken");

function chatDualAuth(req, res, next) {
  const token = bearerFromRequest(req);
  if (!token) {
    return res.status(401).json({
      ok: false,
      error: "auth_required",
      message: "Send a visitor token or Firebase/API bearer token.",
    });
  }

  try {
    const claims = verifyVisitorToken(token);
    if (claims.role === "chat_visitor") {
      req.chatVisitorClaims = claims;
      req.chatReadAs = "visitor";
      return next();
    }
  } catch (_) {
    // Not a visitor token; fall through to hub auth.
  }

  return checkAppAuth(req, res, () => {
    resolveOrgAccess(req, res, () => {
      req.chatReadAs = "agent";
      next();
    });
  });
}

module.exports = {
  chatDualAuth,
};
