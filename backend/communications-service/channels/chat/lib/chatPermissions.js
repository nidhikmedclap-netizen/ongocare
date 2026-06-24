const { HUB_PERMISSIONS } = require("../../../lib/hubPermissions");
const { normalizeOrgSlug } = require("../../../lib/orgSlug");

function membershipForOrg(memberships, orgSlug) {
  const normalized = normalizeOrgSlug(orgSlug);
  if (!normalized || !Array.isArray(memberships)) return null;
  return memberships.find((row) => normalizeOrgSlug(row.orgSlug) === normalized) || null;
}

function hasChatAssignPermission(membership) {
  if (!membership) return false;
  const permissions = Array.isArray(membership.permissions) ? membership.permissions : [];
  return permissions.includes(HUB_PERMISSIONS.CHAT_ASSIGN);
}

function canAssignChat({ req, orgSlug, memberships = [] }) {
  if (req.isSuperAdmin) return true;
  if (!req.firebaseUser?.uid) return false;

  const membership = membershipForOrg(memberships, orgSlug);
  if (String(req.role || "").toLowerCase() === "admin" && membership) {
    return true;
  }

  return hasChatAssignPermission(membership);
}

module.exports = {
  canAssignChat,
  hasChatAssignPermission,
  membershipForOrg,
};
