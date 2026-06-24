const { FieldValue } = require("firebase-admin/firestore");
const { normalizeOrgSlug } = require("../lib/orgSlug");
const { MEMBERSHIP_ROLES, normalizePermissions } = require("../lib/hubPermissions");

function buildOrgMembershipDocument(input = {}) {
  const uid = String(input.uid || "").trim();
  const orgSlug = normalizeOrgSlug(input.orgSlug);
  if (!uid) {
    throw new Error("uid is required for orgMembership");
  }
  if (!orgSlug) {
    throw new Error("orgSlug is required for orgMembership");
  }

  const role = String(input.role || "agent").trim().toLowerCase();
  if (!MEMBERSHIP_ROLES.includes(role)) {
    throw new Error(`invalid orgMembership role: ${role}`);
  }

  return {
    uid,
    orgSlug,
    role,
    permissions: normalizePermissions(input.permissions, role),
    status: input.status || "active",
    grantedBy: input.grantedBy || null,
    grantedAt: input.grantedAt || FieldValue.serverTimestamp(),
    createdAt: input.createdAt || FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
}

module.exports = {
  buildOrgMembershipDocument,
};
