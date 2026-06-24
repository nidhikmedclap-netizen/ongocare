const { parseLimit } = require("../lib/inboxCursor");
const { getInboxOrgScope, getInboxOrgFilter } = require("../lib/hubInboxAccess");
const InboxService = require("../services/InboxService");

const inboxService = new InboxService();

async function handleConversationsList(req, res) {
  try {
    const limit = parseLimit(req.query.limit, 25, 50);
    const cursor = req.query.cursor || null;
    const businessLineE164 = req.query.businessLineE164 || null;
    const orgScope = getInboxOrgScope(req);

    const result = await inboxService.listConversations({
      limit,
      cursor,
      businessLineE164,
      allowedOrgSlugs: getInboxOrgFilter(orgScope),
    });

    return res.status(200).json({
      ok: true,
      conversations: result.conversations,
      pagination: result.pagination,
    });
  } catch (error) {
    const status = error.status || 500;
    console.error("[api/conversations]", error.message || error);
    return res.status(status).json({
      ok: false,
      error: error.message || "internal_error",
    });
  }
}

module.exports = {
  handleConversationsList,
};
