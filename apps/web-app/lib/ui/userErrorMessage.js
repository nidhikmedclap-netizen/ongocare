/** User-facing fallback copy when API / thrown errors are missing or too technical. */
export const ERROR_FALLBACKS = {
  generic: "Something went wrong. Please try again.",
  load: "We couldn't load this information. Please refresh and try again.",
  save: "We couldn't save your changes. Please try again.",
  delete: "We couldn't complete that action. Please try again.",
  upload: "Could not upload your file. Please try again.",
  send: "We couldn't send that. Please try again.",
  sync: "We couldn't sync that data. Please try again.",
  create: "We couldn't create that. Please try again.",
  update: "We couldn't update that. Please try again.",
  auth: "Please sign in again to continue.",
};

const EXACT_TECHNICAL = new Set([
  "fetch failed",
  "unknown error",
  "save failed",
  "update failed",
  "handoff failed",
  "sync failed",
  "request failed",
  "not signed in",
]);

const EXACT_MAP = {
  Unauthorized: ERROR_FALLBACKS.auth,
  Forbidden: "You don't have permission to do that.",
  "Not found": "We couldn't find what you're looking for.",
  "Unknown error": ERROR_FALLBACKS.generic,
};

const TECHNICAL_REGEX = [
  /ECONNREFUSED/i,
  /network error/i,
  /failed to fetch/i,
  /internal server error/i,
  /^\[object /,
  /at Object\./,
  /^\w+Error:/,
  /Unexpected token.*is not valid JSON/i,
  /is not valid JSON/i,
];

const FIREBASE_AUTH_MAP = {
  "auth/too-many-requests":
    "Too many attempts. Please wait a few minutes and try again.",
  "auth/email-already-in-use":
    "That email is already registered. Try signing in instead.",
  "auth/weak-password": "Password is too weak. Try a longer one.",
  "auth/invalid-credential": "Wrong email or password.",
  "auth/wrong-password": "Wrong email or password.",
  "auth/user-not-found": "Wrong email or password.",
  "auth/invalid-email": "Enter a valid email address.",
};

/** Resolve a context key or custom string to the final fallback sentence. */
export function resolveErrorFallback(fallback) {
  if (!fallback) return ERROR_FALLBACKS.generic;
  if (typeof fallback === "string" && ERROR_FALLBACKS[fallback]) {
    return ERROR_FALLBACKS[fallback];
  }
  return fallback;
}

function extractRawMessage(error) {
  if (error == null) return "";
  if (typeof error === "string") return error.trim();
  if (typeof error !== "object") return "";

  const code = error.code || "";
  if (code && FIREBASE_AUTH_MAP[code]) return FIREBASE_AUTH_MAP[code];

  if (typeof error.message === "string") return error.message.trim();
  if (error.success === false && typeof error.message === "string") {
    return error.message.trim();
  }
  return "";
}

function shouldReplaceWithFallback(message) {
  const lower = message.toLowerCase();
  if (EXACT_TECHNICAL.has(lower)) return true;
  if (message.length > 220) return true;
  return TECHNICAL_REGEX.some((pattern) => pattern.test(message));
}

/**
 * Turn an API response, Error, Firebase error, or string into user-readable copy.
 * @param {unknown} error
 * @param {keyof typeof ERROR_FALLBACKS | string} [fallback]
 */
export function userErrorMessage(error, fallback = ERROR_FALLBACKS.generic) {
  const resolvedFallback = resolveErrorFallback(fallback);
  const raw = extractRawMessage(error);
  if (!raw) return resolvedFallback;
  if (shouldReplaceWithFallback(raw)) return resolvedFallback;
  return EXACT_MAP[raw] || raw;
}

/** Throw a sanitized Error when `{ success: false }` API payloads fail. */
export function throwIfApiFailed(data, fallback = ERROR_FALLBACKS.generic) {
  if (data?.success) return;
  throw new Error(userErrorMessage(data, fallback));
}
