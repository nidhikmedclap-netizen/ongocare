const OrgPhoneNumberRepository = require("../repositories/OrgPhoneNumberRepository");
const { normalizeE164 } = require("../lib/phoneE164");

const DEFAULT_CACHE_TTL_MS = 60_000;

class OrgPhoneNumberService {
  constructor(deps = {}) {
    this.repo = deps.orgPhoneNumberRepository || new OrgPhoneNumberRepository();
    this.cacheTtlMs = deps.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS;
    this.cache = new Map();
  }

  async resolveOrgSlug(businessLineE164) {
    const e164 = normalizeE164(businessLineE164);
    if (!e164) return null;

    const cached = this.cache.get(e164);
    if (cached && cached.exp > Date.now()) {
      return cached.orgSlug;
    }

    const mapping = await this.repo.getByE164(e164);
    const orgSlug = mapping?.orgSlug || null;
    this.cache.set(e164, { orgSlug, exp: Date.now() + this.cacheTtlMs });
    return orgSlug;
  }

  clearCache() {
    this.cache.clear();
  }
}

const sharedOrgPhoneNumberService = new OrgPhoneNumberService();

module.exports = {
  OrgPhoneNumberService,
  sharedOrgPhoneNumberService,
};
