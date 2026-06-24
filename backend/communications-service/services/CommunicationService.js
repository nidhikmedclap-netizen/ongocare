const CommunicationRepository = require("../repositories/CommunicationRepository");
const { callCommunicationId } = require("../models/CommunicationEvent");

class CommunicationService {
  constructor(deps = {}) {
    this.repo = deps.communicationRepository || new CommunicationRepository();
  }

  buildCallPreview(callPayload) {
    const direction = (callPayload.direction || "outbound").toLowerCase();
    const duration = callPayload.durationSec;
    if (duration != null && duration > 0) {
      return `${direction === "inbound" ? "Incoming" : "Outgoing"} call · ${duration}s`;
    }
    return `${direction === "inbound" ? "Missed" : "Outgoing"} call`;
  }

  async createCallEvent({
    conversationId,
    contactId,
    callPayload,
    peerE164,
    businessLineE164,
  }) {
    const callSid = callPayload.callSid;
    if (!callSid) {
      throw new Error("callSid is required for call communication event");
    }

    const communicationId = callCommunicationId(callSid);
    const existing = await this.repo.findByProviderSid(callSid);
    if (existing) {
      return existing;
    }

    const direction = (callPayload.direction || "outbound").toLowerCase();
    const status = callPayload.status || "completed";
    const preview = this.buildCallPreview({ ...callPayload, direction });

    return this.repo.upsert(communicationId, {
      conversationId,
      contactId,
      type: "call",
      channel: "voice",
      direction: direction === "inbound" ? "inbound" : "outbound",
      provider: "twilio",
      providerSid: callSid,
      preview,
      status,
      occurredAt: callPayload.completedAt || callPayload.answeredAt || undefined,
      metadata: {
        callSid,
        from: callPayload.from || null,
        to: callPayload.to || null,
        peerE164: peerE164 || null,
        businessLineE164: businessLineE164 || null,
        durationSec: callPayload.durationSec ?? null,
        answeredAt: callPayload.answeredAt || null,
        completedAt: callPayload.completedAt || null,
        childCallSid: callPayload.childCallSid || null,
        recordingSid: callPayload.recordingSid || null,
        recordingUrl: callPayload.recordingUrl || null,
      },
    });
  }
}

module.exports = CommunicationService;
