const { bearerFromRequest } = require("../../../lib/appAuth");
const { verifyVisitorToken } = require("../lib/chatVisitorToken");

function chatVisitorAuth(req, res, next) {
  try {
    const token = bearerFromRequest(req);
    if (!token) {
      return res.status(401).json({
        ok: false,
        error: "visitor_token_required",
      });
    }

    const claims = verifyVisitorToken(token);
    if (claims.role !== "chat_visitor") {
      return res.status(403).json({
        ok: false,
        error: "invalid_visitor_token",
      });
    }

    req.chatVisitor = {
      visitorId: claims.visitorId,
      siteKey: claims.siteKey,
      orgSlug: claims.orgSlug,
    };
    req.chatVisitorClaims = claims;
    return next();
  } catch (error) {
    const code = error.message || "invalid_visitor_token";
    const status = code === "visitor_token_expired" ? 401 : 403;
    return res.status(status).json({
      ok: false,
      error: code,
    });
  }
}

module.exports = {
  chatVisitorAuth,
};
