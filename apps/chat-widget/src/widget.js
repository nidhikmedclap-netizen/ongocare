import { createApiClient, resolveApiBase } from "./api.js";
import { clearSession, loadVisitorState, saveVisitorState } from "./storage.js";
import { createWidgetUi } from "./ui.js";

const DEFAULT_POLL_MS = 3000;

function createMessageKey(message) {
  return message.communicationId || `${message.occurredAt}:${message.body}`;
}

function mergeMessages(existing, incoming) {
  const map = new Map();
  for (const message of existing) {
    map.set(createMessageKey(message), message);
  }
  for (const message of incoming) {
    map.set(createMessageKey(message), message);
  }
  return Array.from(map.values()).sort((left, right) => {
    const leftAt = new Date(left.occurredAt || 0).getTime();
    const rightAt = new Date(right.occurredAt || 0).getTime();
    if (leftAt !== rightAt) return leftAt - rightAt;
    return createMessageKey(left).localeCompare(createMessageKey(right));
  });
}

function createClientMessageId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createWidget(config) {
  const siteKey = String(config.siteKey || "").trim();
  if (!siteKey) {
    throw new Error("siteKey is required");
  }

  const apiBase = resolveApiBase(config);
  const pollIntervalMs = Number(config.pollIntervalMs || DEFAULT_POLL_MS);
  const api = createApiClient({ apiBase, siteKey });

  let visitorId = null;
  let visitorToken = null;
  let sessionId = null;
  let site = null;
  let messages = [];
  let pollTimer = null;
  let bootstrapped = false;
  let ui = null;

  function persistState() {
    saveVisitorState(siteKey, { visitorId, visitorToken, sessionId });
  }

  async function bootstrap() {
    const stored = loadVisitorState(siteKey);
    const payload = await api.bootstrap({
      visitorId: stored.visitorId,
      pageUrl: window.location.href,
      pageTitle: document.title,
      referrer: document.referrer || undefined,
      locale: navigator.language || undefined,
    });

    visitorId = payload.visitorId;
    visitorToken = payload.visitorToken;
    site = payload.site || {};
    sessionId = stored.sessionId;
    persistState();
    bootstrapped = true;
    return payload;
  }

  async function ensureSession() {
    if (sessionId) {
      return sessionId;
    }

    const payload = await api.startSession({ visitorId, visitorToken });
    sessionId = payload.sessionId;
    persistState();
    return sessionId;
  }

  async function pollMessages() {
    if (!sessionId || !visitorToken) {
      return;
    }

    try {
      const payload = await api.listMessages({
        sessionId,
        visitorToken,
      });
      messages = mergeMessages(messages, payload.messages || []);
      ui?.renderMessages(messages);
      ui?.setStatus("");
    } catch (error) {
      if (error.message === "session_closed" || error.message === "session_not_found") {
        clearSession(siteKey);
        sessionId = null;
        messages = [];
        ui?.renderMessages(messages);
      }
      ui?.setStatus("Unable to refresh messages. We will retry.");
    }
  }

  function startPolling() {
    stopPolling();
    pollTimer = window.setInterval(() => {
      if (ui?.isOpen()) {
        pollMessages();
      }
    }, pollIntervalMs);
  }

  function stopPolling() {
    if (pollTimer) {
      window.clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  async function handleOpen() {
    ui?.setComposerEnabled(false);
    ui?.setStatus("Connecting...");

    try {
      if (!bootstrapped) {
        await bootstrap();
      }
      await ensureSession();
      await pollMessages();
      ui?.setStatus("");
      ui?.setComposerEnabled(true);
      startPolling();
    } catch (error) {
      ui?.setStatus(error.message || "Unable to start chat.");
      ui?.setComposerEnabled(false);
    }
  }

  async function handleSend(body) {
    await ensureSession();

    const clientMessageId = createClientMessageId();
    const optimistic = {
      communicationId: `local:${clientMessageId}`,
      body,
      preview: body,
      direction: "inbound",
      contentType: "text",
      occurredAt: new Date().toISOString(),
      sender: { kind: "visitor", displayName: "You" },
    };
    messages = mergeMessages(messages, [optimistic]);
    ui?.renderMessages(messages);

    try {
      const payload = await api.sendMessage({
        sessionId,
        visitorToken,
        body,
        clientMessageId,
      });

      if (payload.communicationId) {
        messages = mergeMessages(
          messages.filter((row) => row.communicationId !== optimistic.communicationId),
          [{
            communicationId: payload.communicationId,
            body: payload.body || body,
            preview: payload.preview || body,
            direction: "inbound",
            contentType: "text",
            occurredAt: new Date().toISOString(),
            sender: { kind: "visitor", displayName: "You" },
          }],
        );
        ui?.renderMessages(messages);
      }

      await pollMessages();
    } catch (error) {
      messages = messages.filter((row) => row.communicationId !== optimistic.communicationId);
      ui?.renderMessages(messages);
      ui?.setStatus(error.message || "Failed to send message.");
      throw error;
    }
  }

  async function init() {
    if (ui) {
      return;
    }

    if (!bootstrapped) {
      await bootstrap();
    }

    const theme = site?.theme || {};
    ui = createWidgetUi({
      theme,
      siteName: site?.name || siteKey,
      onToggle: (isOpen) => {
        if (isOpen) {
          handleOpen();
        } else {
          stopPolling();
        }
      },
      onClose: () => stopPolling(),
      onSend: handleSend,
    });

    ui.mount();
    ui.renderMessages(messages);
  }

  function destroy() {
    stopPolling();
    ui?.destroy();
    ui = null;
  }

  return {
    init,
    destroy,
    open: async () => {
      await init();
      ui?.setOpen(true);
      await handleOpen();
    },
    close: () => {
      ui?.setOpen(false);
      stopPolling();
    },
  };
}
