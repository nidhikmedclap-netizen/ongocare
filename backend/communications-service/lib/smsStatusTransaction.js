const { getFirestore } = require("./firebase");
const { smsCommunicationId } = require("../models/CommunicationEvent");
const {
  shouldApplyStatusUpdate,
  buildSmsStatusPatch,
} = require("./smsStatusMerge");

async function mergeSmsStatusInTransaction(statusPayload) {
  const db = getFirestore();
  const communicationId = smsCommunicationId(statusPayload.messageSid);

  return db.runTransaction(async (transaction) => {
    const communicationRef = db.collection("communications").doc(communicationId);
    const communicationSnap = await transaction.get(communicationRef);

    if (!communicationSnap.exists) {
      return {
        updated: false,
        reason: "communication_not_found",
        communicationId,
        messageSid: statusPayload.messageSid,
      };
    }

    const existingData = communicationSnap.data();
    const currentStatus = existingData.status;

    if (!shouldApplyStatusUpdate(currentStatus, statusPayload.status)) {
      return {
        updated: false,
        duplicate: true,
        communicationId,
        messageSid: statusPayload.messageSid,
        status: currentStatus,
      };
    }

    const patch = buildSmsStatusPatch(existingData, statusPayload);
    transaction.set(communicationRef, patch, { merge: true });

    return {
      updated: true,
      duplicate: false,
      communicationId,
      messageSid: statusPayload.messageSid,
      status: patch.status,
      previousStatus: currentStatus,
    };
  });
}

module.exports = {
  mergeSmsStatusInTransaction,
};
