const ContactService = require("./ContactService");
const ConversationService = require("./ConversationService");
const CommunicationService = require("./CommunicationService");
const CallRepository = require("../repositories/CallRepository");
const { linkCompletedCallInTransaction } = require("../lib/callLinkTransaction");
const { attachOrgSlug } = require("../lib/attachOrgSlug");
const { normalizeE164 } = require("../lib/phoneE164");

function resolveCallParties(callPayload) {
  const from = callPayload.from;
  const to = callPayload.to;
  const direction = String(callPayload.direction || "").trim().toLowerCase();
  const callerIdE164 = normalizeE164(callPayload.callerId);
  const fromE164 = normalizeE164(from);
  const toE164 = normalizeE164(to);
  const childFromE164 = normalizeE164(callPayload.childFrom);

  if (from && String(from).startsWith("client:")) {
    return {
      peerE164: toE164,
      businessLineE164: childFromE164 || callerIdE164,
      direction: "outbound",
    };
  }

  if (direction === "inbound") {
    return {
      peerE164: fromE164,
      businessLineE164: toE164 || callerIdE164,
      direction: "inbound",
    };
  }

  if (direction === "outbound" || direction === "outbound-dial" || direction === "outbound-api") {
    return {
      peerE164: toE164,
      businessLineE164: fromE164 || childFromE164 || callerIdE164,
      direction: "outbound",
    };
  }

  if (fromE164 && toE164 && fromE164 !== toE164) {
    return {
      peerE164: toE164,
      businessLineE164: fromE164,
      direction: direction || "outbound",
    };
  }

  return {
    peerE164: fromE164 || toE164,
    businessLineE164: callerIdE164 || childFromE164,
    direction: direction || "outbound",
  };
}

class CallLinkService {
  constructor(deps = {}) {
    this.contactService = deps.contactService || new ContactService();
    this.conversationService = deps.conversationService || new ConversationService();
    this.communicationService = deps.communicationService || new CommunicationService();
    this.callRepository = deps.callRepository || new CallRepository();
  }

  async linkCompletedCall(callPayload) {
    const parties = resolveCallParties(callPayload);
    if (!parties.peerE164 || !parties.businessLineE164) {
      return {
        linked: false,
        reason: "missing_peer_or_business_line",
        parties,
      };
    }

    const partiesWithOrg = await attachOrgSlug(parties);
    return linkCompletedCallInTransaction(callPayload, partiesWithOrg);
  }
}

module.exports = {
  CallLinkService,
  resolveCallParties,
};
