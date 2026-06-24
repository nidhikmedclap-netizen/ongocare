const express = require("express");
const ChatBootstrapService = require("../services/ChatBootstrapService");
const ChatSessionStartService = require("../services/ChatSessionStartService");
const ChatMessageService = require("../services/ChatMessageService");
const ChatVisitorTimelineService = require("../services/ChatVisitorTimelineService");
const { chatVisitorAuth } = require("../middleware/chatVisitorAuth");

const router = express.Router();
const bootstrapService = new ChatBootstrapService();
const sessionStartService = new ChatSessionStartService();
const messageService = new ChatMessageService();
const timelineService = new ChatVisitorTimelineService();

router.post("/widget/bootstrap", async (req, res) => {
  try {
    const result = await bootstrapService.bootstrap({
      body: req.body || {},
      req,
    });

    return res.status(200).json({
      ok: true,
      visitorId: result.visitorId,
      visitorToken: result.visitorToken,
      site: result.site,
    });
  } catch (error) {
    const status = error.status || 500;
    console.error("[chat/bootstrap]", error.message || error);
    return res.status(status).json({
      ok: false,
      error: error.message || "bootstrap_failed",
    });
  }
});

router.post("/sessions", chatVisitorAuth, async (req, res) => {
  try {
    const result = await sessionStartService.startSession({
      body: req.body || {},
      req,
      tokenClaims: req.chatVisitorClaims,
    });

    return res.status(200).json({
      ok: true,
      sessionId: result.sessionId,
      conversationId: result.conversationId,
      contactId: result.contactId,
      orgSlug: result.orgSlug,
      siteKey: result.siteKey,
      visitorId: result.visitorId,
    });
  } catch (error) {
    const status = error.status || 500;
    console.error("[chat/sessions]", error.message || error);
    return res.status(status).json({
      ok: false,
      error: error.message || "session_start_failed",
    });
  }
});

router.get("/sessions/:sessionId/messages", chatVisitorAuth, async (req, res) => {
  try {
    const sessionId = decodeURIComponent(req.params.sessionId || "").trim();
    const result = await timelineService.listSessionMessages({
      sessionId,
      tokenClaims: req.chatVisitorClaims,
      since: req.query.since || null,
    });

    return res.status(200).json({
      ok: true,
      sessionId: result.sessionId,
      conversationId: result.conversationId,
      messages: result.messages,
    });
  } catch (error) {
    const status = error.status || 500;
    console.error("[chat/messages/list]", error.message || error);
    return res.status(status).json({
      ok: false,
      error: error.message || "message_list_failed",
    });
  }
});

router.post("/sessions/:sessionId/messages", chatVisitorAuth, async (req, res) => {
  try {
    const sessionId = decodeURIComponent(req.params.sessionId || "").trim();
    const result = await messageService.sendVisitorMessage({
      sessionId,
      body: req.body || {},
      tokenClaims: req.chatVisitorClaims,
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
    console.error("[chat/messages]", error.message || error);
    return res.status(status).json({
      ok: false,
      error: error.message || "message_send_failed",
    });
  }
});

module.exports = router;
