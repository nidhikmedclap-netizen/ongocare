const { sharedOrgPhoneNumberService } = require("../services/OrgPhoneNumberService");

async function attachOrgSlug(parties, orgPhoneNumberService = sharedOrgPhoneNumberService) {
  if (!parties?.businessLineE164) {
    return { ...parties, orgSlug: null };
  }

  const orgSlug = await orgPhoneNumberService.resolveOrgSlug(parties.businessLineE164);
  if (!orgSlug) {
    console.warn(
      "[org] no orgPhoneNumbers mapping for business line:",
      parties.businessLineE164,
    );
  }

  return { ...parties, orgSlug };
}

module.exports = {
  attachOrgSlug,
};
