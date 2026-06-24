const { getFirestore } = require("../lib/firebase");
const { staticApiTokenFromRequest } = require("../lib/appAuth");
const { normalizeOrgSlug } = require("../lib/orgSlug");
const { isHubAuthStrict } = require("../lib/hubAuthConfig");
const { logHubAuthShadow, logHubAuthStrict } = require("../lib/hubAuthLog");
const OrgMembershipRepository = require("../repositories/OrgMembershipRepository");
const OrganizationRepository = require("../repositories/OrganizationRepository");
const ServiceAccountRepository = require("../repositories/ServiceAccountRepository");

const ROLE_RANK = {
  viewer: 1,
  agent: 2,
  admin: 3,
};

function pickPrimaryRole(memberships) {
  if (!memberships.length) return null;
  return memberships.reduce((best, row) => {
    const role = String(row.role || "").toLowerCase();
    if (!best) return role;
    return (ROLE_RANK[role] || 0) > (ROLE_RANK[best] || 0) ? role : best;
  }, null);
}

function uniqueOrgSlugs(values) {
  return [...new Set(values.map((slug) => normalizeOrgSlug(slug)).filter(Boolean))];
}

class OrgAccessService {
  constructor(deps = {}) {
    this.membershipRepo = deps.membershipRepo || new OrgMembershipRepository();
    this.organizationRepo = deps.organizationRepo || new OrganizationRepository();
    this.serviceAccountRepo = deps.serviceAccountRepo || new ServiceAccountRepository();
    this.db = deps.db || null;
  }

  firestore() {
    return this.db || getFirestore();
  }

  async loadUserRole(uid) {
    const snap = await this.firestore().collection("users").doc(uid).get();
    if (!snap.exists) return null;
    return snap.data()?.role || null;
  }

  async filterKnownOrganizations(orgSlugs) {
    const known = [];
    const unknown = [];
    for (const orgSlug of orgSlugs) {
      const org = await this.organizationRepo.getBySlug(orgSlug);
      if (org && (org.status || "active") !== "archived") {
        known.push(orgSlug);
      } else {
        unknown.push(orgSlug);
      }
    }
    return { known, unknown };
  }

  async resolveFirebaseUser(uid) {
    const platformRole = await this.loadUserRole(uid);
    const isSuperAdmin = platformRole === "superadmin";

    if (isSuperAdmin) {
      return {
        authType: "firebase",
        uid,
        isSuperAdmin: true,
        role: "superadmin",
        allowedOrgSlugs: null,
        memberships: [],
      };
    }

    const memberships = await this.membershipRepo.listActiveByUid(uid);
    const allowedOrgSlugs = uniqueOrgSlugs(memberships.map((row) => row.orgSlug));
    const role = pickPrimaryRole(memberships);

    return {
      authType: "firebase",
      uid,
      isSuperAdmin: false,
      role,
      allowedOrgSlugs,
      memberships,
    };
  }

  async resolveLegacyServiceAccount() {
    const keyId = (process.env.HUB_SERVICE_ACCOUNT_KEY_ID || "").trim();
    if (keyId) {
      const account = await this.serviceAccountRepo.getByKeyId(keyId);
      if (account && account.status === "active") {
        return {
          authType: "service",
          uid: null,
          isSuperAdmin: false,
          role: account.role || "service",
          allowedOrgSlugs: uniqueOrgSlugs(account.orgSlugs || []),
          memberships: [],
          serviceAccountKeyId: keyId,
        };
      }
    }

    const legacyOrg = normalizeOrgSlug(process.env.COMMUNICATIONS_DEFAULT_ORG_SLUG);
    return {
      authType: "legacy_service",
      uid: null,
      isSuperAdmin: false,
      role: "service",
      allowedOrgSlugs: legacyOrg ? [legacyOrg] : [],
      memberships: [],
      serviceAccountKeyId: keyId || null,
    };
  }

  async resolveForRequest(req) {
    if (req.firebaseUser?.uid) {
      return this.resolveFirebaseUser(req.firebaseUser.uid);
    }

    if (staticApiTokenFromRequest(req)) {
      return this.resolveLegacyServiceAccount();
    }

    return {
      authType: "unknown",
      uid: null,
      isSuperAdmin: false,
      role: null,
      allowedOrgSlugs: [],
      memberships: [],
    };
  }

  async applyRequestContext(req) {
    const access = await this.resolveForRequest(req);
    const strict = isHubAuthStrict();
    const path = req.originalUrl || req.url || req.path;

    req.allowedOrgSlugs = access.allowedOrgSlugs;
    req.role = access.role;
    req.isSuperAdmin = access.isSuperAdmin;
    req.hubAuthType = access.authType;

    if (access.isSuperAdmin) {
      logHubAuthShadow("superadmin_override", {
        uid: access.uid,
        path,
        strict,
      });
      return { access, blocked: false };
    }

    const slugsToValidate =
      access.allowedOrgSlugs === null ? [] : access.allowedOrgSlugs || [];

    if (slugsToValidate.length) {
      const { known, unknown } = await this.filterKnownOrganizations(slugsToValidate);
      if (unknown.length) {
        logHubAuthShadow("unknown_org", {
          uid: access.uid,
          authType: access.authType,
          unknownOrgSlugs: unknown,
          path,
          strict,
        });
      }
      if (known.length !== slugsToValidate.length && strict) {
        access.allowedOrgSlugs = known;
      }
    }

    const hasMembershipAccess =
      access.authType === "firebase" && (access.memberships?.length || 0) > 0;
    const hasOrgScope = (access.allowedOrgSlugs || []).length > 0;

    if (access.authType === "firebase" && !hasMembershipAccess) {
      logHubAuthShadow("missing_membership", {
        uid: access.uid,
        path,
        strict,
      });
    }

    const wouldDeny = !access.isSuperAdmin && !hasOrgScope;

    if (wouldDeny) {
      logHubAuthShadow("would_deny", {
        uid: access.uid,
        authType: access.authType,
        role: access.role,
        path,
        strict,
      });

      if (strict) {
        logHubAuthStrict("request_denied", {
          uid: access.uid,
          authType: access.authType,
          path,
          reason: "empty_org_scope",
        });
        return { access, blocked: true, reason: "empty_org_scope" };
      }
    }

    return { access, blocked: false };
  }
}

module.exports = {
  OrgAccessService,
  pickPrimaryRole,
  uniqueOrgSlugs,
};
