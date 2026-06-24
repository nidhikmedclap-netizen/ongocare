const {
  linkInboundSmsInTransaction,
  linkOutboundSmsInTransaction,
} = require("../lib/smsLinkTransaction");
const { mergeSmsStatusInTransaction } = require("../lib/smsStatusTransaction");
const { attachOrgSlug } = require("../lib/attachOrgSlug");
const { normalizeE164 } = require("../lib/phoneE164");

function resolveInboundSmsParties(smsPayload) {
  const peerE164 = normalizeE164(smsPayload.from);
  const businessLineE164 = normalizeE164(smsPayload.to);

  return {
    peerE164,
    businessLineE164,
    direction: "inbound",
  };
}

class SmsLinkService {
  async linkInboundSms(smsPayload) {
    const parties = resolveInboundSmsParties(smsPayload);
    if (!parties.peerE164 || !parties.businessLineE164) {
      return {
        linked: false,
        reason: "missing_peer_or_business_line",
        parties,
      };
    }

    const partiesWithOrg = await attachOrgSlug(parties);
    return linkInboundSmsInTransaction(smsPayload, partiesWithOrg);
  }

  async linkOutboundSms(smsPayload) {
    const parties = resolveOutboundSmsParties(smsPayload);
    if (!parties.peerE164 || !parties.businessLineE164) {
      return {
        linked: false,
        reason: "missing_peer_or_business_line",
        parties,
      };
    }

    const partiesWithOrg = await attachOrgSlug(parties);
    return linkOutboundSmsInTransaction(smsPayload, partiesWithOrg);
  }

  async updateDeliveryStatus(statusPayload) {
    return mergeSmsStatusInTransaction(statusPayload);
  }
}

function resolveOutboundSmsParties(smsPayload) {
  const peerE164 = normalizeE164(smsPayload.to);
  const businessLineE164 = normalizeE164(smsPayload.from);

  return {
    peerE164,
    businessLineE164,
    direction: "outbound",
  };
}

module.exports = {
  SmsLinkService,
  resolveInboundSmsParties,
  resolveOutboundSmsParties,
};
