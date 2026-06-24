function joinUrl(base, path) {
  return `${String(base).replace(/\/+$/, "")}${path}`;
}

function parseJsonResponse(response) {
  return response.json().catch(() => ({}));
}

export function createApiClient({ apiBase, siteKey }) {
  async function bootstrap({ visitorId, pageUrl, pageTitle, referrer, locale }) {
    const response = await fetch(joinUrl(apiBase, "/api/chat/widget/bootstrap"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        siteKey,
        visitorId: visitorId || undefined,
        pageUrl,
        pageTitle,
        referrer,
        locale,
      }),
    });

    const payload = await parseJsonResponse(response);
    if (!response.ok || !payload.ok) {
      throw new Error(payload.error || `bootstrap_failed_${response.status}`);
    }

    return payload;
  }

  async function startSession({ visitorId, visitorToken }) {
    const response = await fetch(joinUrl(apiBase, "/api/chat/sessions"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${visitorToken}`,
      },
      body: JSON.stringify({
        siteKey,
        visitorId,
      }),
    });

    const payload = await parseJsonResponse(response);
    if (!response.ok || !payload.ok) {
      throw new Error(payload.error || `session_start_failed_${response.status}`);
    }

    return payload;
  }

  async function sendMessage({ sessionId, visitorToken, body, clientMessageId }) {
    const response = await fetch(
      joinUrl(apiBase, `/api/chat/sessions/${encodeURIComponent(sessionId)}/messages`),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${visitorToken}`,
        },
        body: JSON.stringify({
          body,
          clientMessageId,
        }),
      },
    );

    const payload = await parseJsonResponse(response);
    if (!response.ok || !payload.ok) {
      throw new Error(payload.error || `send_failed_${response.status}`);
    }

    return payload;
  }

  async function listMessages({ sessionId, visitorToken, since }) {
    const query = since ? `?since=${encodeURIComponent(since)}` : "";
    const response = await fetch(
      joinUrl(apiBase, `/api/chat/sessions/${encodeURIComponent(sessionId)}/messages${query}`),
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${visitorToken}`,
        },
      },
    );

    const payload = await parseJsonResponse(response);
    if (!response.ok || !payload.ok) {
      throw new Error(payload.error || `poll_failed_${response.status}`);
    }

    return payload;
  }

  return {
    bootstrap,
    startSession,
    sendMessage,
    listMessages,
  };
}

export function resolveApiBase(config) {
  if (config.apiBase) {
    return String(config.apiBase).replace(/\/+$/, "");
  }

  const currentScript = document.currentScript;
  if (currentScript?.src) {
    try {
      const url = new URL(currentScript.src);
      return `${url.protocol}//${url.host}`;
    } catch {
      // Fall through.
    }
  }

  return "https://communications.ongocare.com";
}
