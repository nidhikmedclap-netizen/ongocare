const crypto = require("crypto");

const DEFAULT_TTL_SEC = 60 * 60 * 12;

function visitorTokenSecret() {
  const secret = (
    process.env.CHAT_VISITOR_TOKEN_SECRET ||
    process.env.SMS_APP_API_KEY ||
    ""
  ).trim();
  if (!secret) {
    throw new Error("CHAT_VISITOR_TOKEN_SECRET is not configured");
  }
  return secret;
}

function base64urlEncode(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64urlDecode(value) {
  const padded = value + "=".repeat((4 - (value.length % 4)) % 4);
  return Buffer.from(padded.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
}

function signVisitorToken(payload, ttlSec = DEFAULT_TTL_SEC) {
  const secret = visitorTokenSecret();
  const header = base64urlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64urlEncode(
    JSON.stringify({
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + ttlSec,
    }),
  );
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${header}.${body}`)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${header}.${body}.${signature}`;
}

function verifyVisitorToken(token) {
  const secret = visitorTokenSecret();
  const parts = String(token || "").split(".");
  if (parts.length !== 3) {
    throw new Error("invalid_visitor_token");
  }

  const [header, body, signature] = parts;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${header}.${body}`)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    sigBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
  ) {
    throw new Error("invalid_visitor_token");
  }

  const payload = JSON.parse(base64urlDecode(body));
  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("visitor_token_expired");
  }

  return payload;
}

module.exports = {
  signVisitorToken,
  verifyVisitorToken,
  visitorTokenSecret,
};
