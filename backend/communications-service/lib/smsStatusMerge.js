const { FieldValue } = require("firebase-admin/firestore");

const SMS_STATUS_RANK = {
  queued: 1,
  sent: 2,
  delivered: 3,
  failed: 3,
  undelivered: 3,
};

const TERMINAL_SMS_STATUSES = new Set(["delivered", "failed", "undelivered"]);

function normalizeSmsStatus(status) {
  return status != null ? String(status).trim().toLowerCase() : "";
}

function smsStatusRank(status) {
  return SMS_STATUS_RANK[normalizeSmsStatus(status)] ?? 0;
}

function isTerminalSmsStatus(status) {
  return TERMINAL_SMS_STATUSES.has(normalizeSmsStatus(status));
}

function shouldApplyStatusUpdate(currentStatus, incomingStatus) {
  const current = normalizeSmsStatus(currentStatus);
  const incoming = normalizeSmsStatus(incomingStatus);
  if (!incoming) return false;
  if (current === incoming) return false;
  if (isTerminalSmsStatus(current)) return false;
  if (smsStatusRank(incoming) < smsStatusRank(current)) return false;
  return true;
}

function appendStatusHistory(existingHistory, incomingStatus) {
  const history = Array.isArray(existingHistory) ? [...existingHistory] : [];
  const incoming = normalizeSmsStatus(incomingStatus);
  if (!incoming) return history;
  if (history[history.length - 1] === incoming) return history;
  history.push(incoming);
  return history;
}

function buildSmsStatusPatch(existingData, statusPayload) {
  const incomingStatus = normalizeSmsStatus(statusPayload.status);
  const existingMetadata = existingData.metadata || {};
  const statusHistory = appendStatusHistory(existingMetadata.statusHistory, incomingStatus);

  const metadata = {
    ...existingMetadata,
    statusHistory,
  };

  if (statusPayload.errorCode != null) {
    metadata.errorCode = statusPayload.errorCode;
  } else if (metadata.errorCode === undefined) {
    metadata.errorCode = null;
  }

  if (statusPayload.errorMessage != null) {
    metadata.errorMessage = statusPayload.errorMessage;
  } else if (metadata.errorMessage === undefined) {
    metadata.errorMessage = null;
  }

  return {
    status: incomingStatus,
    metadata,
    updatedAt: FieldValue.serverTimestamp(),
  };
}

module.exports = {
  SMS_STATUS_RANK,
  TERMINAL_SMS_STATUSES,
  normalizeSmsStatus,
  smsStatusRank,
  isTerminalSmsStatus,
  shouldApplyStatusUpdate,
  appendStatusHistory,
  buildSmsStatusPatch,
};
