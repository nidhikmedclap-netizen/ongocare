const express = require("express");
const { checkAppAuth } = require("../../../lib/appAuth");
const { resolveOrgAccess } = require("../../../lib/resolveOrgAccess");
const { chatCors } = require("../middleware/chatCors");
const readRoutes = require("./readRoutes");
const widgetRoutes = require("./widgetRoutes");
const agentRoutes = require("./agentRoutes");
const analyticsRoutes = require("./analyticsRoutes");

const router = express.Router();
router.use(chatCors);
router.use(readRoutes);
router.use(widgetRoutes);
router.use(checkAppAuth, resolveOrgAccess, agentRoutes);
router.use(checkAppAuth, resolveOrgAccess, analyticsRoutes);

module.exports = router;
