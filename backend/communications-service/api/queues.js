const { parseLimit } = require("../lib/inboxCursor");
const { getInboxOrgScope, getInboxOrgFilter } = require("../lib/hubInboxAccess");
const QueueService = require("../services/QueueService");

const queueService = new QueueService();

function createQueueHandler(queueId) {
  return async function handleQueue(req, res) {
    try {
      const limit = parseLimit(req.query.limit, 25, 50);
      const cursor = req.query.cursor || null;
      const orgScope = getInboxOrgScope(req);

      const result = await queueService.listQueue({
        queueId,
        limit,
        cursor,
        allowedOrgSlugs: getInboxOrgFilter(orgScope),
        agentUid: orgScope.uid,
      });

      return res.status(200).json({
        ok: true,
        queue: result.queue,
        conversations: result.conversations,
        pagination: result.pagination,
      });
    } catch (error) {
      const status = error.status || 500;
      console.error(`[api/queues/${queueId}]`, error.message || error);
      return res.status(status).json({
        ok: false,
        error: error.message || "internal_error",
      });
    }
  };
}

module.exports = {
  handleUnassignedQueue: createQueueHandler("unassigned"),
  handleMineQueue: createQueueHandler("mine"),
  handleWaitingAgentQueue: createQueueHandler("waiting-agent"),
  handleWaitingVisitorQueue: createQueueHandler("waiting-visitor"),
  handleClosedQueue: createQueueHandler("closed"),
};
