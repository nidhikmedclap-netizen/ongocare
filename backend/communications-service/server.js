require("dotenv").config();

const path = require("path");
const express = require("express");
const { initFirebaseAdmin } = require("./lib/firebase");
const { handleTwilioCallWebhook } = require("./webhooks/twilioCallWebhook");
const { handleTwilioSmsInboundWebhook } = require("./webhooks/twilioSmsInboundWebhook");
const { handleTwilioSmsStatusWebhook } = require("./webhooks/twilioSmsStatusWebhook");
const { checkAppAuth } = require("./lib/appAuth");
const { resolveOrgAccess } = require("./lib/resolveOrgAccess");
const { handleSmsSend } = require("./api/smsSend");
const { handleConversationsList } = require("./api/conversationsList");
const { handleConversationDetail } = require("./api/conversationDetail");
const {
  handleUnassignedQueue,
  handleMineQueue,
  handleWaitingAgentQueue,
  handleWaitingVisitorQueue,
  handleClosedQueue,
} = require("./api/queues");
const chatRoutes = require("./channels/chat/routes");

const PORT = Number(process.env.PORT || 3102);

function requiredEnv(name) {
  const value = (process.env[name] || "").trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function validateConfig() {
  requiredEnv("FIREBASE_PROJECT_ID");
  requiredEnv("GOOGLE_APPLICATION_CREDENTIALS");
  requiredEnv("COMMUNICATIONS_PUBLIC_URL");
  if (!(process.env.TWILIO_AUTH_TOKEN || "").trim()) {
    console.warn(
      "[config] TWILIO_AUTH_TOKEN is not set — Twilio webhooks will reject requests until configured",
    );
  }
}

const app = express();
app.set("trust proxy", true);
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.get("/health", (req, res) => {
  let firebaseReady = false;
  try {
    initFirebaseAdmin();
    firebaseReady = true;
  } catch (error) {
    console.warn("[health] firebase not ready:", error.message);
  }

  res.json({
    ok: true,
    service: "communications-service",
    firebaseAdmin: firebaseReady,
    firebaseProject: process.env.FIREBASE_PROJECT_ID || null,
  });
});

app.post("/webhooks/twilio/calls", handleTwilioCallWebhook);
app.post("/webhooks/twilio/sms/inbound", handleTwilioSmsInboundWebhook);
app.post("/webhooks/twilio/sms/status", handleTwilioSmsStatusWebhook);
app.use(
  "/widget",
  express.static(path.join(__dirname, "public/widget"), {
    maxAge: process.env.NODE_ENV === "production" ? "1h" : 0,
    setHeaders(res, filePath) {
      if (filePath.endsWith(".js")) {
        res.setHeader("Content-Type", "application/javascript; charset=utf-8");
      }
    },
  }),
);
app.use("/api/chat", chatRoutes);
app.post("/api/sms/send", checkAppAuth, resolveOrgAccess, handleSmsSend);
app.get("/api/conversations", checkAppAuth, resolveOrgAccess, handleConversationsList);
app.get(
  "/api/conversations/:conversationId",
  checkAppAuth,
  resolveOrgAccess,
  handleConversationDetail,
);
app.get("/api/queues/unassigned", checkAppAuth, resolveOrgAccess, handleUnassignedQueue);
app.get("/api/queues/mine", checkAppAuth, resolveOrgAccess, handleMineQueue);
app.get("/api/queues/waiting-agent", checkAppAuth, resolveOrgAccess, handleWaitingAgentQueue);
app.get("/api/queues/waiting-visitor", checkAppAuth, resolveOrgAccess, handleWaitingVisitorQueue);
app.get("/api/queues/closed", checkAppAuth, resolveOrgAccess, handleClosedQueue);

app.use((req, res) => {
  res.status(404).json({ ok: false, error: "not_found" });
});

app.use((error, req, res, next) => {
  console.error("[server]", error);
  res.status(500).json({ ok: false, error: "internal_error" });
});

function start() {
  validateConfig();
  initFirebaseAdmin();

  app.listen(PORT, () => {
    console.log(
      `Communications service listening on :${PORT} (project=${process.env.FIREBASE_PROJECT_ID})`,
    );
  });
}

if (require.main === module) {
  start();
}

module.exports = { app, start };
