const STORAGE_PREFIX = "ongocare.chat.";

function storageKey(siteKey, suffix) {
  return `${STORAGE_PREFIX}${siteKey}.${suffix}`;
}

export function loadVisitorState(siteKey) {
  try {
  const visitorId = localStorage.getItem(storageKey(siteKey, "visitorId"));
  const visitorToken = localStorage.getItem(storageKey(siteKey, "visitorToken"));
  const sessionId = localStorage.getItem(storageKey(siteKey, "sessionId"));
  return { visitorId, visitorToken, sessionId };
  } catch {
    return { visitorId: null, visitorToken: null, sessionId: null };
  }
}

export function saveVisitorState(siteKey, state) {
  try {
    if (state.visitorId) {
      localStorage.setItem(storageKey(siteKey, "visitorId"), state.visitorId);
    }
    if (state.visitorToken) {
      localStorage.setItem(storageKey(siteKey, "visitorToken"), state.visitorToken);
    }
    if (state.sessionId) {
      localStorage.setItem(storageKey(siteKey, "sessionId"), state.sessionId);
    }
  } catch {
    // Ignore quota or private-mode failures.
  }
}

export function clearSession(siteKey) {
  try {
    localStorage.removeItem(storageKey(siteKey, "sessionId"));
  } catch {
    // Ignore.
  }
}
