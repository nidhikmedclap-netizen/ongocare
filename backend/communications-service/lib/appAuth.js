const { initFirebaseAdmin, admin } = require("./firebase");

function looksLikeFirebaseJwt(token) {
  return typeof token === "string" && token.split(".").length === 3;
}

function bearerFromRequest(req) {
  const header = req.get("authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : "";
}

function firebaseIdTokenFromRequest(req) {
  const bearer = bearerFromRequest(req);
  if (bearer && looksLikeFirebaseJwt(bearer)) return bearer;

  for (const name of ["x-firebase-token", "x-id-token", "x-firebase-id-token"]) {
    const value = req.get(name);
    if (value && looksLikeFirebaseJwt(String(value).trim())) {
      return String(value).trim();
    }
  }

  return "";
}

function appBearerSecret() {
  const smsKey = (process.env.SMS_APP_API_KEY || "").trim();
  const appToken = (process.env.APP_BEARER_TOKEN || "").trim();
  if (smsKey && appToken && smsKey !== appToken) {
    console.warn("[auth] SMS_APP_API_KEY and APP_BEARER_TOKEN differ; using SMS_APP_API_KEY");
  }
  return smsKey || appToken || "";
}

function staticApiTokenFromRequest(req) {
  const bearer = bearerFromRequest(req);
  const expected = appBearerSecret();
  if (bearer && looksLikeFirebaseJwt(bearer)) return "";
  if (bearer && expected && bearer === expected) return bearer;

  const apiKey = req.get("x-api-key");
  if (apiKey && expected && String(apiKey).trim() === expected) {
    return String(apiKey).trim();
  }

  return "";
}

async function tryFirebaseAuth(req) {
  const idToken = firebaseIdTokenFromRequest(req);
  if (!idToken) return false;

  initFirebaseAdmin();
  const decoded = await admin.auth().verifyIdToken(idToken);
  req.firebaseUser = decoded;
  return true;
}

async function checkAppAuth(req, res, next) {
  try {
    if (await tryFirebaseAuth(req)) {
      return next();
    }
  } catch (error) {
    return res.status(401).json({
      ok: false,
      error: "invalid_firebase_token",
      message: "Firebase sign-in token was rejected. Sign out, sign in again, then retry.",
    });
  }

  if (staticApiTokenFromRequest(req)) {
    return next();
  }

  const expected = appBearerSecret();
  if (!expected) {
    return res.status(503).json({
      ok: false,
      error: "api_auth_disabled",
      message: "Set FIREBASE credentials and/or SMS_APP_API_KEY / APP_BEARER_TOKEN",
    });
  }

  return res.status(401).json({
    ok: false,
    error: "unauthorized",
    message:
      "Send Authorization: Bearer <Firebase ID token> or configure SMS_APP_API_KEY.",
  });
}

module.exports = {
  checkAppAuth,
  bearerFromRequest,
  firebaseIdTokenFromRequest,
  staticApiTokenFromRequest,
  looksLikeFirebaseJwt,
  appBearerSecret,
};
