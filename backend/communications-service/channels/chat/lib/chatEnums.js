const SENDER_KINDS = Object.freeze(["visitor", "agent", "bot", "system"]);

const CHAT_CONTENT_TYPES = Object.freeze([
  "text",
  "system_event",
  "attachment",
  "summary",
]);

const SYSTEM_EVENT_TYPES = Object.freeze([
  "session_started",
  "session_closed",
  "assignment",
  "transfer",
  "ai_started",
  "ai_handoff",
  "ai_escalation",
  "lead_qualified",
  "kb_citation",
  "summary_updated",
]);

const AI_MODES = Object.freeze(["off", "bot", "human", "hybrid"]);

const CHAT_SESSION_STATUSES = Object.freeze([
  "queued",
  "active",
  "idle",
  "closed",
]);

const HANDOFF_STATUSES = Object.freeze([
  "none",
  "requested",
  "assigned",
  "completed",
]);

const LEAD_STATUSES = Object.freeze([
  "unknown",
  "in_progress",
  "qualified",
  "disqualified",
]);

const ASSIGNMENT_TYPES = Object.freeze(["agent", "bot"]);

function normalizeEnumValue(value, allowed, fallback = null) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return fallback;
  return allowed.includes(normalized) ? normalized : fallback;
}

function normalizeSender(input = {}) {
  const kind = normalizeEnumValue(input.kind, SENDER_KINDS);
  if (!kind) return null;

  return {
    kind,
    uid: input.uid ? String(input.uid).trim() : null,
    visitorId: input.visitorId ? String(input.visitorId).trim() : null,
    botId: input.botId ? String(input.botId).trim() : null,
    displayName: input.displayName ? String(input.displayName).trim() : null,
  };
}

function normalizeContentType(value) {
  return normalizeEnumValue(value, CHAT_CONTENT_TYPES, "text");
}

function normalizeAssignmentType(value, fallback = "agent") {
  return normalizeEnumValue(value, ASSIGNMENT_TYPES, fallback);
}

module.exports = {
  SENDER_KINDS,
  CHAT_CONTENT_TYPES,
  SYSTEM_EVENT_TYPES,
  AI_MODES,
  CHAT_SESSION_STATUSES,
  HANDOFF_STATUSES,
  LEAD_STATUSES,
  ASSIGNMENT_TYPES,
  normalizeEnumValue,
  normalizeSender,
  normalizeContentType,
  normalizeAssignmentType,
};
