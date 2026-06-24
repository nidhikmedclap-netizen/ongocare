const express = require("express");
const ChatReadService = require("../services/ChatReadService");
const { chatDualAuth } = require("../middleware/chatDualAuth");

const router = express.Router();
const readService = new ChatReadService();

router.post("/conversations/:conversationId/read", chatDualAuth, async (req, res) => {
  try {
    const conversationId = decodeURIComponent(req.params.conversationId || "").trim();
    const readerType = req.chatReadAs;

    const result = await readService.markConversationRead({
      conversationId,
      req,
      readerType,
      tokenClaims: req.chatVisitorClaims || null,
    });

    return res.status(200).json({
      ok: true,
      conversationId: result.conversationId,
      sessionId: result.sessionId,
      readerType: result.readerType,
      unreadAgent: result.unreadAgent,
      unreadVisitor: result.unreadVisitor,
    });
  } catch (error) {
    const status = error.status || 500;
    console.error("[chat/read]", error.message || error);
    return res.status(status).json({
      ok: false,
      error: error.message || "read_failed",
    });
  }
});

module.exports = router;
