const { normalizeOrgSlug } = require("../../../lib/orgSlug");
const { getInboxOrgScope, getInboxOrgFilter } = require("../../../lib/hubInboxAccess");

function resolveAnalyticsOrgSlugs(req, requestedOrgSlug = null) {
  const scope = getInboxOrgScope(req);
  const orgFilter = getInboxOrgFilter(scope);
  const normalizedRequest = requestedOrgSlug ? normalizeOrgSlug(requestedOrgSlug) : null;

  if (normalizedRequest) {
    if (!scope.isSuperAdmin && orgFilter && !orgFilter.includes(normalizedRequest)) {
      const error = new Error("hub_forbidden");
      error.status = 403;
      throw error;
    }
    return {
      orgSlugs: [normalizedRequest],
      isSuperAdmin: scope.isSuperAdmin,
    };
  }

  if (scope.isSuperAdmin) {
    return {
      orgSlugs: null,
      isSuperAdmin: true,
    };
  }

  if (!orgFilter?.length) {
    const error = new Error("hub_forbidden");
    error.status = 403;
    throw error;
  }

  return {
    orgSlugs: orgFilter,
    isSuperAdmin: false,
  };
}

module.exports = {
  resolveAnalyticsOrgSlugs,
};
