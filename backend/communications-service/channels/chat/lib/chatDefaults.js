const { AI_MODES, HANDOFF_STATUSES, LEAD_STATUSES } = require("./chatEnums");

function defaultConversationAi(input = {}) {
  const mode = input.mode || "off";
  return {
    mode: AI_MODES.includes(mode) ? mode : "off",
    botId: input.botId ? String(input.botId).trim() : null,
    active: Boolean(input.active),
    startedAt: input.startedAt || null,
    handoffAt: input.handoffAt || null,
    handoffReason: input.handoffReason ? String(input.handoffReason).trim() : null,
    assignedBotRunId: input.assignedBotRunId ? String(input.assignedBotRunId).trim() : null,
    lastBotMessageAt: input.lastBotMessageAt || null,
  };
}

function defaultConversationSummary(input = null) {
  if (!input) return null;

  return {
    text: input.text ? String(input.text).trim() : null,
    generatedAt: input.generatedAt || null,
    generatedBy: input.generatedBy ? String(input.generatedBy).trim() : null,
    model: input.model ? String(input.model).trim() : null,
    runId: input.runId ? String(input.runId).trim() : null,
    messageCountAtGeneration: input.messageCountAtGeneration ?? null,
    version: input.version ?? null,
  };
}

function defaultConversationLead(input = {}) {
  const status = input.status || "unknown";
  return {
    status: LEAD_STATUSES.includes(status) ? status : "unknown",
    score: input.score ?? null,
    fields: input.fields && typeof input.fields === "object" ? input.fields : {},
    qualifiedAt: input.qualifiedAt || null,
    qualifiedBy: input.qualifiedBy ? String(input.qualifiedBy).trim() : null,
  };
}

function defaultSessionAi(input = {}) {
  const mode = input.mode || "off";
  return {
    mode: AI_MODES.includes(mode) ? mode : "off",
    botId: input.botId ? String(input.botId).trim() : null,
    runId: input.runId ? String(input.runId).trim() : null,
    handoffRequested: Boolean(input.handoffRequested),
    handoffReason: input.handoffReason ? String(input.handoffReason).trim() : null,
  };
}

function defaultSessionHandoff(input = {}) {
  const status = input.status || "none";
  return {
    status: HANDOFF_STATUSES.includes(status) ? status : "none",
    requestedAt: input.requestedAt || null,
    reason: input.reason ? String(input.reason).trim() : null,
    requestedBy: input.requestedBy ? String(input.requestedBy).trim() : null,
    assignedTo: input.assignedTo ? String(input.assignedTo).trim() : null,
    assignedAt: input.assignedAt || null,
  };
}

function defaultSessionContext(input = {}) {
  return {
    pageUrl: input.pageUrl ? String(input.pageUrl).trim() : null,
    pageTitle: input.pageTitle ? String(input.pageTitle).trim() : null,
    referrer: input.referrer ? String(input.referrer).trim() : null,
    locale: input.locale ? String(input.locale).trim() : null,
    userAgent: input.userAgent ? String(input.userAgent).trim() : null,
    utm: {
      source: input.utm?.source ? String(input.utm.source).trim() : null,
      medium: input.utm?.medium ? String(input.utm.medium).trim() : null,
      campaign: input.utm?.campaign ? String(input.utm.campaign).trim() : null,
      term: input.utm?.term ? String(input.utm.term).trim() : null,
      content: input.utm?.content ? String(input.utm.content).trim() : null,
    },
    siteKey: input.siteKey ? String(input.siteKey).trim() : null,
    updatedAt: input.updatedAt || null,
  };
}

function defaultSessionQualification(input = {}) {
  return {
    step: input.step ? String(input.step).trim() : null,
    answers: input.answers && typeof input.answers === "object" ? input.answers : {},
    completedSteps: Array.isArray(input.completedSteps) ? input.completedSteps : [],
    startedAt: input.startedAt || null,
  };
}

function defaultSiteAi(input = {}) {
  return {
    enabled: Boolean(input.enabled),
    botId: input.botId ? String(input.botId).trim() : null,
    defaultMode: input.defaultMode || "off",
    knowledgeBase: input.knowledgeBase || null,
    handoffRules: input.handoffRules || null,
    qualificationFlowId: input.qualificationFlowId
      ? String(input.qualificationFlowId).trim()
      : null,
  };
}

module.exports = {
  defaultConversationAi,
  defaultConversationSummary,
  defaultConversationLead,
  defaultSessionAi,
  defaultSessionHandoff,
  defaultSessionContext,
  defaultSessionQualification,
  defaultSiteAi,
};
