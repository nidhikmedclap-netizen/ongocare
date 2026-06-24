const { normalizeOrgSlug } = require("./orgSlug");

function buildOrgMembershipDocId(uid, orgSlug) {
  const normalizedUid = String(uid || "").trim();
  const normalizedOrgSlug = normalizeOrgSlug(orgSlug);
  if (!normalizedUid || !normalizedOrgSlug) return null;
  return `${normalizedUid}__${normalizedOrgSlug}`;
}

function parseOrgMembershipDocId(docId) {
  const text = String(docId || "").trim();
  const separator = text.indexOf("__");
  if (separator <= 0) return null;
  const uid = text.slice(0, separator);
  const orgSlug = normalizeOrgSlug(text.slice(separator + 2));
  if (!uid || !orgSlug) return null;
  return { uid, orgSlug };
}

module.exports = {
  buildOrgMembershipDocId,
  parseOrgMembershipDocId,
};
