const { OrgAccessService } = require("../services/OrgAccessService");

const orgAccessService = new OrgAccessService();

async function resolveOrgAccess(req, res, next) {
  try {
    const result = await orgAccessService.applyRequestContext(req);

    if (result.blocked) {
      return res.status(403).json({
        ok: false,
        error: "hub_forbidden",
        message: "No organization access configured for this principal.",
      });
    }

    return next();
  } catch (error) {
    console.error("[hub-auth] resolveOrgAccess failed:", error.message || error);
    return res.status(500).json({
      ok: false,
      error: "hub_auth_resolution_failed",
      message: "Failed to resolve organization access.",
    });
  }
}

module.exports = {
  resolveOrgAccess,
  orgAccessService,
};
