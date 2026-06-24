const ORG_SLUG_RE = /^[a-z0-9][a-z0-9_-]{0,39}$/;

function normalizeOrgSlug(raw) {
  if (raw == null || raw === "") return null;
  const slug = String(raw).trim().toLowerCase();
  if (!slug || !ORG_SLUG_RE.test(slug)) return null;
  return slug;
}

module.exports = {
  ORG_SLUG_RE,
  normalizeOrgSlug,
};
