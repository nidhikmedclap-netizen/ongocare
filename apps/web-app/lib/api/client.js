import {
  ERROR_FALLBACKS,
  userErrorMessage,
} from "@/lib/ui/userErrorMessage";

/**
 * Parse a fetch Response as JSON. Handles empty bodies, HTML error pages,
 * and other non-JSON responses with user-readable errors.
 */
export async function readApiJson(response, fallback = ERROR_FALLBACKS.generic) {
  const resolvedFallback = userErrorMessage(null, fallback);
  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();

  if (!text) {
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("We couldn't find that record. Try refreshing the page.");
      }
      throw new Error(resolvedFallback);
    }
    return { success: true };
  }

  const looksLikeHtml =
    text.trimStart().startsWith("<") &&
    !contentType.includes("application/json");

  if (looksLikeHtml) {
    if (response.status === 404) {
      throw new Error("We couldn't find that record. Try refreshing the page.");
    }
    throw new Error(resolvedFallback);
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(resolvedFallback);
  }
}
