const express = require("express");
const ChatAnalyticsService = require("../services/ChatAnalyticsService");

const router = express.Router();
const analyticsService = new ChatAnalyticsService();

function createAnalyticsHandler(methodName) {
  return async function handleAnalytics(req, res) {
    try {
      const result = await analyticsService[methodName]({
        req,
        query: req.query || {},
      });

      return res.status(200).json({
        ok: true,
        ...result,
      });
    } catch (error) {
      const status = error.status || 500;
      console.error(`[chat/analytics/${methodName}]`, error.message || error);
      return res.status(status).json({
        ok: false,
        error: error.message || "analytics_failed",
      });
    }
  };
}

router.get("/analytics/overview", createAnalyticsHandler("getOverview"));
router.get("/analytics/sites", createAnalyticsHandler("getSiteAttribution"));
router.get("/analytics/campaigns", createAnalyticsHandler("getCampaignAttribution"));
router.get("/analytics/agents", createAnalyticsHandler("getAgentMetrics"));

module.exports = router;
