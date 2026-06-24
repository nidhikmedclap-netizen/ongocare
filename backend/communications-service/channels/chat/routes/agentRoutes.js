const express = require("express");
const ChatAgentMessageService = require("../services/ChatAgentMessageService");
const ChatAssignmentService = require("../services/ChatAssignmentService");

const router = express.Router();
const agentMessageService = new ChatAgentMessageService();
const assignmentService = new ChatAssignmentService();

router.post("/conversations/:conversationId/messages", async (req, res) => {
  try {
    const conversationId = decodeURIComponent(req.params.conversationId || "").trim();
    const result = await agentMessageService.sendAgentMessage({
      conversationId,
      body: req.body || {},
      req,
    });

    return res.status(result.duplicate ? 200 : 201).json({
      ok: true,
      duplicate: result.duplicate,
      communicationId: result.communicationId,
      conversationId: result.conversationId,
      sessionId: result.sessionId,
      preview: result.preview,
      body: result.body,
    });
  } catch (error) {
    const status = error.status || 500;
    console.error("[chat/agent/messages]", error.message || error);
    return res.status(status).json({
      ok: false,
      error: error.message || "agent_message_failed",
    });
  }
});

router.post("/conversations/:conversationId/assign", async (req, res) => {
  try {
    const conversationId = decodeURIComponent(req.params.conversationId || "").trim();
    const result = await assignmentService.assignConversation({
      conversationId,
      body: req.body || {},
      req,
    });

    return res.status(200).json({
      ok: true,
      conversationId: result.conversationId,
      sessionId: result.sessionId,
      communicationId: result.communicationId,
      preview: result.preview,
      assignment: result.assignment,
    });
  } catch (error) {
    const status = error.status || 500;
    console.error("[chat/assign]", error.message || error);
    return res.status(status).json({
      ok: false,
      error: error.message || "assignment_failed",
    });
  }
});

router.post("/conversations/:conversationId/unassign", async (req, res) => {
  try {
    const conversationId = decodeURIComponent(req.params.conversationId || "").trim();
    const result = await assignmentService.unassignConversation({
      conversationId,
      req,
    });

    return res.status(200).json({
      ok: true,
      conversationId: result.conversationId,
      sessionId: result.sessionId,
      communicationId: result.communicationId,
      preview: result.preview,
      assignment: null,
    });
  } catch (error) {
    const status = error.status || 500;
    console.error("[chat/unassign]", error.message || error);
    return res.status(status).json({
      ok: false,
      error: error.message || "unassignment_failed",
    });
  }
});

module.exports = router;
