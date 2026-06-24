// lib/api/rateLimit.js
//
// Lightweight in-memory rate limiting for API routes (per server instance).

/** @type {Map<string, { count: number, reset: number }>} */
const buckets = new Map();

export function clientIpFromRequest(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

/**
 * @returns {boolean} true if request is allowed
 */
export function checkRateLimit(key, { windowMs = 60_000, max = 120 } = {}) {
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket || bucket.reset <= now) {
    bucket = { count: 0, reset: now + windowMs };
    buckets.set(key, bucket);
  }
  bucket.count += 1;
  return bucket.count <= max;
}

/** Stricter limits for sensitive public endpoints */
export const RATE_LIMITS = {
  default: { windowMs: 60_000, max: 120 },
  auth: { windowMs: 60_000, max: 20 },
  payment: { windowMs: 60_000, max: 30 },
  publicProbe: { windowMs: 60_000, max: 40 },
};

export function rateLimitOrNull(request, profile = "default") {
  const limits = RATE_LIMITS[profile] || RATE_LIMITS.default;
  const ip = clientIpFromRequest(request);
  const path = (() => {
    try {
      return new URL(request.url).pathname;
    } catch {
      return "unknown";
    }
  })();
  const key = `${ip}:${path}`;
  if (!checkRateLimit(key, limits)) {
    return { status: 429, message: "Too many requests. Please try again shortly." };
  }
  return null;
}
