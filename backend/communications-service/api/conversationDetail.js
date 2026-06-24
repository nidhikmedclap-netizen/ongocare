const { parseLimit } = require("../lib/inboxCursor");
const { getInboxOrgScope, checkConversationOrgAccess } = require("../lib/hubInboxAccess");
const InboxService = require("../services/InboxService");

const inboxService = new InboxService();

async function handleConversationDetail(req, res) {
  try {
    const conversationId = decodeURIComponent(req.params.conversationId || "").trim();
    if (!conversationId) {
      return res.status(400).json({
        ok: false,
        error: "conversation_id_required",
      });
    }

    const limit = parseLimit(req.query.limit, 50, 100);
    const cursor = req.query.cursor || null;
    const orgScope = getInboxOrgScope(req);

    const result = await inboxService.getConversationDetail({
      conversationId,
      limit,
      cursor,
    });

    const access = checkConversationOrgAccess(
      { id: conversationId, orgSlug: result.conversation?.orgSlug },
      orgScope,
    );
    if (!access.allowed) {
      return res.status(access.status).json(access.body);
    }

    return res.status(200).json({
      ok: true,
      conversation: result.conversation,
      contact: result.contact,
      timeline: result.timeline,
      pagination: result.pagination,
    });
  } catch (error) {
    const status = error.status || 500;
    console.error("[api/conversations/:id]", error.message || error);
    return res.status(status).json({
      ok: false,
      error: error.message || "internal_error",
    });
  }
}

module.exports = {
  handleConversationDetail,
};
