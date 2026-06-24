import "dotenv/config";
import fs from "fs";
import path from "path";

/**
 * Twilio Voice token + SMS log API for TwilioCallApp.
 *
 * Voice: GET /api/voice-session — preferred for apps: { token, identity } (identity from server only, ignores ?identity=).
 * iOS VoIP incoming: set TWILIO_VOICE_PUSH_CREDENTIAL_SID (Twilio Push Credential SID) or Twilio errors 52004 on <Dial><Client>.
 * GET /token?identity=... — legacy; identity = env TWILIO_VOICE_CLIENT_IDENTITY else ?identity= else default.
 * GET /api/voice-client-identity — JSON { identity, locked } for diagnostics (no bearer).
 * SMS send: POST /api/sms/send (alias POST /sms) JSON { to, body } optional from; if from omitted use TWILIO_DEFAULT_SMS_FROM.
 * Inbound SMS: Twilio webhook POST /webhook/sms
 * History: GET /api/sms/inbound (alias GET /messages); optional Bearer if APP_BEARER_TOKEN is set
 * Voicemail + call recordings: GET /api/voicemails merges local voicemail log with Twilio recordings.list (needs TWILIO_AUTH_TOKEN). GET /api/voicemails/:RecordingSid/media (canonical) and GET /api/voicemail/:RecordingSid/audio (legacy) — same Bearer when set; both proxy Twilio MP3.
 * Phone numbers: GET /api/twilio/phone-numbers — lists IncomingPhoneNumber resources (needs TWILIO_AUTH_TOKEN)
 *
 * Voice outbound (TwiML App): POST|GET /webhook/voice — Twilio Console → TwiML App → “A call comes in” URL.
 * Uses `To` + `CallerId` from the Voice SDK connect params (see iOS TwilioVoiceBridge). No APP_BEARER_TOKEN.
 *
 * PSTN voicemail (Phone Number → Voice): POST|GET /webhook/voice-incoming — rings Voice SDK client, then <Record> + Twilio transcribe.
 * Per-number mailboxes: optional data/voice-inbound-lines.json (or VOICE_INBOUND_LINES_PATH) — greeting, ring timeout, optional clientIdentity per E.164.
 * Set TWILIO_VOICE_CLIENT_IDENTITY so PSTN <Client> matches GET /api/voice-session JWT identity (default when a line omits clientIdentity). TwiML App URL stays /webhook/voice.
 *
 * Same Bearer: GET /api/voicemails/:RecordingSid/media (production path) or GET /api/voicemail/:RecordingSid/audio — proxies Twilio MP3.
 * Voicemail <Record> transcription: opt-in with TWILIO_VOICEMAIL_TRANSCRIBE=1 (default off — avoids accounts without transcription breaking recordings).
 *
 * Optional thank-you SMS to the caller after voicemail: TWILIO_VOICEMAIL_THANKYOU_SMS_ENABLED=1, TWILIO_VOICEMAIL_THANKYOU_SMS_TEXT, TWILIO_DEFAULT_SMS_FROM (or TWILIO_VOICEMAIL_THANKYOU_SMS_FROM). Delay: TWILIO_VOICEMAIL_THANKYOU_SMS_DELAY_MS (default 5000). Template may use {from} {to} {line}.
 */

import express from "express";
import twilio from "twilio";
import admin from "firebase-admin";

const app = express();
const port = Number(process.env.PORT || 3001);

/** @type {{ id: string, from: string, to: string, body: string, direction: string, at: string }[]} */
const messageLog = [];
const MAX_MESSAGES = 500;

const SMS_LOG_PATH = process.env.SMS_LOG_PATH || path.join(process.cwd(), "data", "sms-log.json");
const VOICEMAIL_LOG_PATH = process.env.VOICEMAIL_LOG_PATH || path.join(process.cwd(), "data", "voicemail-log.json");
const MISSED_CALL_LOG_PATH =
  process.env.MISSED_CALL_LOG_PATH || path.join(process.cwd(), "data", "missed-call-sms-log.json");
const VOICE_INBOUND_LINES_PATH =
  process.env.VOICE_INBOUND_LINES_PATH || path.join(process.cwd(), "data", "voice-inbound-lines.json");

/** @type {object[]} */
const voicemailLog = [];
const MAX_VOICEMAILS = 200;

/** @type {{ callSid: string, toLine: string, toCaller: string, fromLine: string, at: string, messageSid?: string }[]} */
const missedCallSmsLog = [];
const MAX_MISSED_CALL_SMS = 500;

/** @type {{ mtime: number, lines: object[] } | null} */
let voiceInboundLinesCache = null;

function digitsOnlyPhone(s) {
  return String(s ?? "").replace(/\D/g, "");
}

function normalizeMailboxKey(raw) {
  const t = String(raw ?? "").trim();
  if (!t) return "";
  if (t.startsWith("+")) return t;
  const d = digitsOnlyPhone(t);
  if (d.length === 10) return `+1${d}`;
  if (d.length === 11 && d.startsWith("1")) return `+${d}`;
  if (d.length > 0) return `+${d}`;
  return t;
}

function numbersMatchE164(a, b) {
  const da = digitsOnlyPhone(a);
  const db = digitsOnlyPhone(b);
  if (!da || !db) return false;
  if (da === db) return true;
  if (da.length === 10 && db.length === 11 && db.startsWith("1") && db.slice(1) === da) return true;
  if (db.length === 10 && da.length === 11 && da.startsWith("1") && da.slice(1) === db) return true;
  return false;
}

/** True when `to` is one of our configured inbound Twilio numbers (self-call → voicemail loop). */
function destinationIsOwnedInboundLine(to) {
  const key = normalizeMailboxKey(to);
  if (!key) return false;
  const lines = readVoiceInboundLines();
  if (lines.some((row) => row?.number && numbersMatchE164(row.number, key))) return true;
  for (const raw of [
    process.env.TWILIO_DEFAULT_VOICE_FROM,
    process.env.TWILIO_DEFAULT_SMS_FROM,
  ]) {
    const d = (raw || "").trim();
    if (d && numbersMatchE164(d, key)) return true;
  }
  return false;
}

function readVoiceInboundLines() {
  try {
    if (!fs.existsSync(VOICE_INBOUND_LINES_PATH)) {
      if (!voiceInboundLinesCache) voiceInboundLinesCache = { mtime: -1, lines: [] };
      return voiceInboundLinesCache.lines;
    }
    const st = fs.statSync(VOICE_INBOUND_LINES_PATH);
    if (voiceInboundLinesCache && voiceInboundLinesCache.mtime === st.mtimeMs) {
      return voiceInboundLinesCache.lines;
    }
    const raw = fs.readFileSync(VOICE_INBOUND_LINES_PATH, "utf8");
    const j = JSON.parse(raw);
    const lines = Array.isArray(j.lines) ? j.lines : [];
    voiceInboundLinesCache = { mtime: st.mtimeMs, lines };
    console.log(`Loaded ${lines.length} inbound voice line(s) from ${VOICE_INBOUND_LINES_PATH}`);
    return lines;
  } catch (e) {
    console.error("voice-inbound-lines load failed:", e.message || e);
    return [];
  }
}

function loadVoicemailLogFromDisk() {
  try {
    if (!fs.existsSync(VOICEMAIL_LOG_PATH)) return;
    const raw = fs.readFileSync(VOICEMAIL_LOG_PATH, "utf8");
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return;
    for (const row of arr.slice(-MAX_VOICEMAILS)) {
      if (row && typeof row.recordingSid === "string") voicemailLog.push(row);
    }
    console.log(`Loaded ${voicemailLog.length} voicemail rows from ${VOICEMAIL_LOG_PATH}`);
  } catch (e) {
    console.error("Voicemail log load failed:", e.message || e);
  }
}

function loadMissedCallSmsLogFromDisk() {
  try {
    if (!fs.existsSync(MISSED_CALL_LOG_PATH)) return;
    const raw = fs.readFileSync(MISSED_CALL_LOG_PATH, "utf8");
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return;
    for (const row of arr.slice(-MAX_MISSED_CALL_SMS)) {
      if (row && typeof row.callSid === "string") missedCallSmsLog.push(row);
    }
    console.log(`Loaded ${missedCallSmsLog.length} missed-call SMS rows from ${MISSED_CALL_LOG_PATH}`);
  } catch (e) {
    console.error("Missed-call SMS log load failed:", e.message || e);
  }
}

function saveMissedCallSmsLogToDisk() {
  try {
    const dir = path.dirname(MISSED_CALL_LOG_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const slice = missedCallSmsLog.slice(-MAX_MISSED_CALL_SMS);
    fs.writeFileSync(MISSED_CALL_LOG_PATH, JSON.stringify(slice), "utf8");
  } catch (e) {
    console.error("Missed-call SMS log save failed:", e.message || e);
  }
}

function saveVoicemailLogToDisk() {
  try {
    const dir = path.dirname(VOICEMAIL_LOG_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const slice = voicemailLog.slice(-MAX_VOICEMAILS);
    fs.writeFileSync(VOICEMAIL_LOG_PATH, JSON.stringify(slice), "utf8");
  } catch (e) {
    console.error("Voicemail log save failed:", e.message || e);
  }
}

function publicBaseUrl(req) {
  const envBase = (process.env.PUBLIC_BASE_URL || "").trim().replace(/\/$/, "");
  if (envBase) return envBase;
  let proto = req.get("x-forwarded-proto") || req.protocol || "https";
  if (proto.includes(",")) proto = proto.split(",")[0].trim();
  let host = req.get("x-forwarded-host") || req.get("host") || "";
  if (host.includes(",")) host = host.split(",")[0].trim();
  if (!host) return "";
  return `${proto}://${host}`.replace(/\/$/, "");
}

function ensureSmsLogDir() {
  const dir = path.dirname(SMS_LOG_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadMessageLogFromDisk() {
  try {
    if (!fs.existsSync(SMS_LOG_PATH)) return;
    const raw = fs.readFileSync(SMS_LOG_PATH, "utf8");
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return;
    for (const row of arr.slice(-MAX_MESSAGES)) {
      if (
        row &&
        typeof row.id === "string" &&
        typeof row.from === "string" &&
        typeof row.to === "string" &&
        typeof row.body === "string" &&
        typeof row.direction === "string" &&
        typeof row.at === "string"
      ) {
        messageLog.push(row);
      }
    }
    if (messageLog.length > MAX_MESSAGES) messageLog.splice(0, messageLog.length - MAX_MESSAGES);
    console.log(`Loaded ${messageLog.length} SMS rows from ${SMS_LOG_PATH}`);
  } catch (e) {
    console.error("SMS log load failed:", e.message || e);
  }
}

function saveMessageLogToDisk() {
  try {
    ensureSmsLogDir();
    const slice = messageLog.slice(-MAX_MESSAGES);
    fs.writeFileSync(SMS_LOG_PATH, JSON.stringify(slice), "utf8");
  } catch (e) {
    console.error("SMS log save failed:", e.message || e);
  }
}

let firebaseAdminEnabled = false;
let firebaseAdminInitTried = false;

function initFirebaseAdminIfNeeded() {
  if (firebaseAdminInitTried) return;
  firebaseAdminInitTried = true;
  try {
    if (admin.apps.length === 0) {
      const projectId = (process.env.FIREBASE_PROJECT_ID || "").trim();
      admin.initializeApp(
        projectId
          ? { credential: admin.credential.applicationDefault(), projectId }
          : { credential: admin.credential.applicationDefault() }
      );
    }
    firebaseAdminEnabled = true;
    console.log("Firebase Admin auth verification enabled.");
  } catch (e) {
    firebaseAdminEnabled = false;
    console.warn("Firebase Admin unavailable; Firebase ID token auth disabled:", e.message || e);
  }
}

async function verifyFirebaseIDToken(req) {
  const idToken = (req.headers["x-firebase-id-token"] || "").toString().trim();
  if (!idToken) return false;
  initFirebaseAdminIfNeeded();
  if (!firebaseAdminEnabled) return false;
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    req.firebaseUser = decoded;
    return true;
  } catch (e) {
    console.warn("Invalid Firebase ID token:", e.message || e);
    return false;
  }
}

async function requireBearer(req, res, next) {
  const secret = process.env.APP_BEARER_TOKEN;
  if (!secret) {
    const okFirebase = await verifyFirebaseIDToken(req);
    if (!okFirebase && (process.env.REQUIRE_FIREBASE_ID_TOKEN || "").trim() === "1") {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    return next();
  }
  const h = req.headers.authorization || "";
  if (h === `Bearer ${secret}`) return next();
  const okFirebase = await verifyFirebaseIDToken(req);
  if (!okFirebase) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

app.get("/", (_req, res) => {
  res.type("text/plain").send("TwilioCallApp backend OK\n");
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

const DEFAULT_VOICE_CLIENT_IDENTITY = "voice_client";

/** Alphanumeric + underscore, max 121 — must match between Voice JWT and <Dial><Client>. */
function sanitizeVoiceClientIdentity(raw) {
  const s = String(raw ?? "")
    .trim()
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .slice(0, 121);
  return s || DEFAULT_VOICE_CLIENT_IDENTITY;
}

/** When TWILIO_VOICE_CLIENT_IDENTITY is set, it wins over ?identity= so inbound PSTN always matches the JWT. */
function identityForAccessToken(req) {
  const envId = (process.env.TWILIO_VOICE_CLIENT_IDENTITY || "").trim();
  if (envId) return sanitizeVoiceClientIdentity(envId);
  const q = typeof req.query?.identity === "string" ? req.query.identity.trim() : "";
  if (q) return sanitizeVoiceClientIdentity(q);
  return DEFAULT_VOICE_CLIENT_IDENTITY;
}

/** Webhook URL ?ClientIdentity= overrides; then env; then default (same as token when env unset). */
function identityForIncomingDial(req) {
  const fromQuery = pickParam(req, "ClientIdentity", "Identity", "clientIdentity");
  if (fromQuery) return sanitizeVoiceClientIdentity(fromQuery);
  const envId = (process.env.TWILIO_VOICE_CLIENT_IDENTITY || "").trim();
  if (envId) return sanitizeVoiceClientIdentity(envId);
  return DEFAULT_VOICE_CLIENT_IDENTITY;
}

/** Same identity the app receives from GET /api/voice-session (no client-supplied ?identity=). */
function identityForServerVoiceSession() {
  const envId = (process.env.TWILIO_VOICE_CLIENT_IDENTITY || "").trim();
  if (envId) return sanitizeVoiceClientIdentity(envId);
  return DEFAULT_VOICE_CLIENT_IDENTITY;
}

/** @returns {"sandbox"|"production"|null} */
function normalizeApnsEnvironment(raw) {
  const v = String(raw || "")
    .trim()
    .toLowerCase();
  if (v === "production" || v === "prod") return "production";
  if (v === "sandbox" || v === "development" || v === "dev") return "sandbox";
  return null;
}

/** Xcode/Debug → sandbox; TestFlight/App Store → production. */
function apnsEnvironmentFromRequest(req) {
  const q = req?.query?.apns ?? req?.query?.apns_environment;
  if (q != null) return normalizeApnsEnvironment(q);
  const h = req?.get?.("X-APNs-Environment") ?? req?.headers?.["x-apns-environment"];
  if (h) return normalizeApnsEnvironment(h);
  return null;
}

function resolvePushCredentialSid(apnsEnvironment) {
  const fallback = (process.env.TWILIO_VOICE_PUSH_CREDENTIAL_SID || "").trim();
  const production = (process.env.TWILIO_VOICE_PUSH_CREDENTIAL_SID_PRODUCTION || "").trim();
  const sandbox = (process.env.TWILIO_VOICE_PUSH_CREDENTIAL_SID_SANDBOX || "").trim();
  const env = normalizeApnsEnvironment(apnsEnvironment);
  if (env === "production") return production || fallback;
  if (env === "sandbox") return sandbox || fallback;
  return fallback;
}

function mintVoiceJwt(identity, apnsEnvironment) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const apiKeySid = process.env.TWILIO_API_KEY_SID;
  const apiKeySecret = process.env.TWILIO_API_KEY_SECRET;
  const twimlAppSid = process.env.TWILIO_TWIML_APP_SID;

  if (!accountSid || !apiKeySid || !apiKeySecret || !twimlAppSid) {
    return {
      error: "Missing env: TWILIO_ACCOUNT_SID, TWILIO_API_KEY_SID, TWILIO_API_KEY_SECRET, TWILIO_TWIML_APP_SID",
    };
  }

  const AccessToken = twilio.jwt.AccessToken;
  const VoiceGrant = AccessToken.VoiceGrant;

  const pushCredentialSid = resolvePushCredentialSid(apnsEnvironment);
  const grantOpts = {
    outgoingApplicationSid: twimlAppSid,
    incomingAllow: true,
  };
  if (pushCredentialSid) {
    grantOpts.pushCredentialSid = pushCredentialSid;
  }

  const token = new AccessToken(accountSid, apiKeySid, apiKeySecret, { identity });
  const grant = new VoiceGrant(grantOpts);
  token.addGrant(grant);
  return {
    token: token.toJwt(),
    identity,
    apns_environment: normalizeApnsEnvironment(apnsEnvironment) || "default",
    push_credential_sid: pushCredentialSid || null,
  };
}

app.get("/api/voice-client-identity", (_req, res) => {
  const envRaw = (process.env.TWILIO_VOICE_CLIENT_IDENTITY || "").trim();
  const id = identityForServerVoiceSession();
  res.json({
    identity: id,
    locked: !!envRaw,
    default: DEFAULT_VOICE_CLIENT_IDENTITY,
  });
});

app.get("/api/voice-session", (req, res) => {
  const identity = identityForServerVoiceSession();
  const apns = apnsEnvironmentFromRequest(req);
  const out = mintVoiceJwt(identity, apns);
  if (out.error) {
    res.status(500).json({ error: out.error });
    return;
  }
  res.json({
    token: out.token,
    identity: out.identity,
    apns_environment: out.apns_environment,
    push_credential_sid: out.push_credential_sid,
  });
});

app.get("/token", (req, res) => {
  const identity = identityForAccessToken(req);
  const apns = apnsEnvironmentFromRequest(req);
  const out = mintVoiceJwt(identity, apns);
  if (out.error) {
    res.status(500).json({ error: out.error });
    return;
  }
  res.json({
    token: out.token,
    identity: out.identity,
    apns_environment: out.apns_environment,
    push_credential_sid: out.push_credential_sid,
  });
});

async function handleSmsSend(req, res) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) {
    res.status(503).json({ error: "Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN to send SMS." });
    return;
  }
  const { to, body } = req.body || {};
  if (typeof to !== "string" || typeof body !== "string") {
    res.status(400).json({ error: "JSON body must include to, body strings." });
    return;
  }
  let from = typeof req.body.from === "string" ? req.body.from.trim() : "";
  if (!from) {
    from = (process.env.TWILIO_DEFAULT_SMS_FROM || "").trim();
  }
  if (!from) {
    res.status(400).json({
      error: "Provide from in JSON or set TWILIO_DEFAULT_SMS_FROM for server-default caller ID.",
    });
    return;
  }
  const client = twilio(accountSid, authToken);
  try {
    const msg = await client.messages.create({ to, from, body });
    const row = {
      id: msg.sid,
      from,
      to,
      body,
      direction: "outbound",
      at: new Date().toISOString(),
    };
    messageLog.push(row);
    if (messageLog.length > MAX_MESSAGES) messageLog.splice(0, messageLog.length - MAX_MESSAGES);
    saveMessageLogToDisk();
    res.json({ ok: true, sid: msg.sid });
  } catch (e) {
    console.error("SMS send error:", e);
    res.status(500).json({ error: e.message || "SMS send failed" });
  }
}

function missedCallSmsEnabled() {
  return (process.env.TWILIO_MISSED_CALL_SMS_ENABLED || "").trim() === "1";
}

function missedCallSmsTextTemplate() {
  return (process.env.TWILIO_MISSED_CALL_SMS_TEXT || "").trim();
}

function missedCallSmsDelayMs() {
  const rawDelay = parseInt(process.env.TWILIO_MISSED_CALL_SMS_DELAY_MS || "4000", 10);
  return Number.isFinite(rawDelay) ? Math.max(0, rawDelay) : 4000;
}

/**
 * @param {{ callSid: string, fromCaller: string, toLine: string }} ctx
 */
function scheduleMissedCallSms(ctx) {
  if (!missedCallSmsEnabled()) return;
  const { callSid, fromCaller, toLine } = ctx;
  if (!callSid || !fromCaller || !toLine) return;
  if (missedCallSmsLog.some((r) => r.callSid === callSid)) return;
  const delayMs = missedCallSmsDelayMs();
  setTimeout(() => {
    deliverMissedCallSms(ctx).catch((e) => console.error("missed-call sms:", e.message || e));
  }, delayMs);
}

/**
 * @param {{ callSid: string, fromCaller: string, toLine: string }} ctx
 */
async function deliverMissedCallSms(ctx) {
  const template = missedCallSmsTextTemplate();
  if (!template) return;
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) return;

  const callSid = (ctx.callSid || "").trim();
  const toCaller = (ctx.fromCaller || "").trim();
  const toLine = (ctx.toLine || "").trim();
  if (!callSid || !toCaller || !toLine) return;

  if (missedCallSmsLog.some((r) => r.callSid === callSid)) return;

  const smsFrom = (toLine || process.env.TWILIO_DEFAULT_SMS_FROM || "").trim();
  if (!smsFrom) return;

  const body = template
    .replaceAll("{from}", toCaller)
    .replaceAll("{to}", toLine)
    .replaceAll("{line}", toLine);

  const client = twilio(accountSid, authToken);
  try {
    const msg = await client.messages.create({ to: toCaller, from: smsFrom, body });
    const now = new Date().toISOString();
    missedCallSmsLog.push({ callSid, toLine, toCaller, fromLine: smsFrom, at: now, messageSid: msg.sid });
    if (missedCallSmsLog.length > MAX_MISSED_CALL_SMS) {
      missedCallSmsLog.splice(0, missedCallSmsLog.length - MAX_MISSED_CALL_SMS);
    }
    saveMissedCallSmsLogToDisk();

    const row = { id: msg.sid, from: smsFrom, to: toCaller, body, direction: "outbound", at: now };
    messageLog.push(row);
    if (messageLog.length > MAX_MESSAGES) messageLog.splice(0, messageLog.length - MAX_MESSAGES);
    saveMessageLogToDisk();
    console.log(`missed-call SMS sent to ${toCaller} line=${toLine} msg=${msg.sid}`);
  } catch (e) {
    console.error("missed-call SMS send failed:", e.message || e);
  }
}

app.use("/sms", express.json());
app.post("/sms", requireBearer, handleSmsSend);
app.use("/api/sms/send", express.json());
app.post("/api/sms/send", requireBearer, handleSmsSend);

/** @param {import("express").Request} req */
function pickParam(req, ...keys) {
  const fromBody = req.body && typeof req.body === "object" ? req.body : {};
  const q = req.query && typeof req.query === "object" ? req.query : {};
  for (const k of keys) {
    const a = fromBody[k];
    const b = q[k];
    const s = (typeof a === "string" ? a : typeof b === "string" ? b : "").trim();
    if (s) return s;
  }
  return "";
}

function defaultVoicemailLine() {
  const envId = (process.env.TWILIO_VOICE_CLIENT_IDENTITY || "").trim();
  const ring = Number(process.env.TWILIO_VOICEMAIL_RING_TIMEOUT || 25) || 25;
  const greeting =
    (process.env.TWILIO_VOICEMAIL_GREETING_DEFAULT || "").trim() ||
    "Sorry, no one is available. Please leave a message after the tone.";
  return {
    clientIdentity: sanitizeVoiceClientIdentity(envId || DEFAULT_VOICE_CLIENT_IDENTITY),
    ringTimeoutSeconds: Math.max(5, Math.min(120, ring)),
    voicemailGreeting: greeting,
  };
}

/** Twilio “To” / “Called” on inbound PSTN. */
function calledNumberFromIncoming(req) {
  return pickParam(req, "To", "Called", "CalledTo");
}

function resolveInboundLineForRequest(req) {
  const calledRaw = calledNumberFromIncoming(req);
  const mailboxKey = normalizeMailboxKey(calledRaw);
  const lines = readVoiceInboundLines();
  const queryAwareIdentity = identityForIncomingDial(req);
  const fallback = { ...defaultVoicemailLine(), clientIdentity: queryAwareIdentity };
  if (!mailboxKey) {
    return { ...fallback, mailboxKey: "" };
  }
  const hit = lines.find((row) => row && row.number && numbersMatchE164(row.number, mailboxKey));
  if (!hit) {
    return { ...fallback, mailboxKey };
  }
  const ring = hit.ringTimeoutSeconds != null ? Number(hit.ringTimeoutSeconds) : fallback.ringTimeoutSeconds;
  return {
    mailboxKey,
    clientIdentity: sanitizeVoiceClientIdentity(hit.clientIdentity || queryAwareIdentity),
    ringTimeoutSeconds: Math.max(5, Math.min(120, ring || fallback.ringTimeoutSeconds)),
    voicemailGreeting: (hit.voicemailGreeting || "").trim() || fallback.voicemailGreeting,
  };
}

function resolveVoicemailGreetingForMailbox(mailboxKey) {
  const lines = readVoiceInboundLines();
  const def = defaultVoicemailLine().voicemailGreeting;
  if (!mailboxKey) return def;
  const hit = lines.find((row) => row && row.number && numbersMatchE164(row.number, mailboxKey));
  if (hit && (hit.voicemailGreeting || "").trim()) return hit.voicemailGreeting.trim();
  return def;
}

/** Prefer query ?toLine= (from our Dial action / Record callbacks) so the row matches the PSTN mailbox. */
function pickMailboxTo(body, req) {
  const q = req.query && typeof req.query.toLine === "string" ? req.query.toLine.trim() : "";
  if (q) return q;
  return String(body?.To ?? "").trim();
}

function voiceOutboundTwiML(req, res) {
  const to = pickParam(req, "To", "to");
  let callerId = pickParam(req, "CallerId", "callerId");
  if (!callerId) {
    callerId = (process.env.TWILIO_DEFAULT_VOICE_FROM || process.env.TWILIO_DEFAULT_SMS_FROM || "").trim();
  }
  console.log(`voice-outbound To=${to || "-"} CallerId=${callerId || "-"} From=${pickParam(req, "From", "from") || "-"}`);
  const vr = new twilio.twiml.VoiceResponse();
  if (!to) {
    vr.say({ voice: "alice" }, "No destination number.");
    res.type("text/xml").send(vr.toString());
    return;
  }
  if (!callerId) {
    vr.say(
      { voice: "alice" },
      "No caller ID. Use a business line in the app, or set TWILIO_DEFAULT_VOICE_FROM on the server."
    );
    res.type("text/xml").send(vr.toString());
    return;
  }
  if (numbersMatchE164(to, callerId) || destinationIsOwnedInboundLine(to)) {
    console.warn(`voice-outbound blocked self-call to owned line ${to}`);
    vr.say(
      { voice: "alice" },
      "You cannot call your own business line from this app. Please dial an external phone number."
    );
    res.type("text/xml").send(vr.toString());
    return;
  }
  const dial = vr.dial({ callerId });
  dial.number(to);
  res.type("text/xml").send(vr.toString());
}

app.post("/webhook/voice", express.urlencoded({ extended: false }), voiceOutboundTwiML);
app.get("/webhook/voice", voiceOutboundTwiML);

/**
 * Twilio SDK outbound webhook requests can accidentally hit /webhook/voice-incoming
 * when TwiML App Voice URL is misconfigured. In that case we should still place the
 * outbound PSTN call instead of routing into inbound voicemail flow.
 */
function looksLikeSdkOutboundWebhook(req) {
  const to = pickParam(req, "To", "to");
  const callerId = pickParam(req, "CallerId", "callerId");
  const from = pickParam(req, "From", "from");
  const hasPstnTo = /^\+?[1-9]\d{6,14}$/.test(String(to || "").replace(/\s+/g, ""));
  const hasCaller = !!String(callerId || "").trim();
  const fromIsClient = String(from || "").trim().toLowerCase().startsWith("client:");
  return hasPstnTo && (hasCaller || fromIsClient);
}

/** PSTN → ring Voice SDK client; on no-answer/busy/failed, prompt + Record + transcribe. */
function voiceIncomingPSTN(req, res) {
  if (looksLikeSdkOutboundWebhook(req)) {
    console.warn("voice-incoming: detected SDK outbound payload; routing to outbound TwiML handler");
    return voiceOutboundTwiML(req, res);
  }
  const base = publicBaseUrl(req);
  const line = resolveInboundLineForRequest(req);
  const vr = new twilio.twiml.VoiceResponse();
  if (!base) {
    vr.say({ voice: "alice" }, "Server URL unknown. Set PUBLIC_BASE_URL for voicemail callbacks.");
    res.type("text/xml").send(vr.toString());
    return;
  }
  const qs = new URLSearchParams();
  if (line.mailboxKey) qs.set("toLine", line.mailboxKey);
  const qstr = qs.toString();
  const actionUrl = qstr ? `${base}/webhook/voice-dial-complete?${qstr}` : `${base}/webhook/voice-dial-complete`;
  const dial = vr.dial({
    timeout: line.ringTimeoutSeconds,
    action: actionUrl,
    method: "POST",
  });
  // Send the dialed Twilio number to mobile clients so they can map inbound calls
  // to the exact line (used for UI labels + missed-call redial caller ID).
  const client = dial.client();
  client.identity(line.clientIdentity);
  if (line.mailboxKey) {
    client.parameter({ name: "toLine", value: line.mailboxKey });
  }
  res.type("text/xml").send(vr.toString());
}

/** After <Dial> ends: if not answered, take a voicemail. */
function voiceDialComplete(req, res) {
  const status = (req.body.DialCallStatus || "").trim();
  const base = publicBaseUrl(req);
  const vr = new twilio.twiml.VoiceResponse();
  const mailboxKey =
    (req.query && typeof req.query.toLine === "string" && req.query.toLine.trim()) ||
    normalizeMailboxKey(pickParam(req, "To")) ||
    "";
  const fromCaller = String(req.body.From || "").trim();
  const callSid = String(req.body.CallSid || "").trim();
  if (status === "completed" || status === "answered") {
    res.type("text/xml").send(vr.toString());
    return;
  }
  if (!["no-answer", "busy", "failed", "canceled"].includes(status)) {
    res.type("text/xml").send(vr.toString());
    return;
  }

  if (fromCaller && mailboxKey && callSid) {
    scheduleMissedCallSms({ callSid, fromCaller, toLine: mailboxKey });
  }
  if (!base) {
    vr.say({ voice: "alice" }, "Cannot record voicemail: set PUBLIC_BASE_URL.");
    res.type("text/xml").send(vr.toString());
    return;
  }
  const greeting = resolveVoicemailGreetingForMailbox(mailboxKey);
  vr.say({ voice: "alice" }, greeting);
  const qs = new URLSearchParams();
  if (mailboxKey) qs.set("toLine", mailboxKey);
  const qSuffix = qs.toString() ? `?${qs.toString()}` : "";
  /** Transcription is opt-in: `transcribe="true"` can fail or behave badly if the Twilio project does not have recording transcription enabled, which prevents callers’ messages from being stored. */
  const voicemailTranscribe = (process.env.TWILIO_VOICEMAIL_TRANSCRIBE || "").trim() === "1";
  const recordOpts = {
    maxLength: 120,
    timeout: 5,
    playBeep: true,
    recordingStatusCallback: `${base}/webhook/voice-recording-status${qSuffix}`,
    recordingStatusCallbackMethod: "POST",
    recordingStatusCallbackEvent: "completed",
  };
  if (voicemailTranscribe) {
    recordOpts.transcribe = true;
    recordOpts.transcribeCallback = `${base}/webhook/voice-transcription${qSuffix}`;
  }
  vr.record(recordOpts);
  res.type("text/xml").send(vr.toString());
}

function upsertVoicemailFromRecording(body) {
  const recordingSid = body.RecordingSid || "";
  if (!recordingSid) return;
  const from = body.From || "";
  const to = body.To || "";
  const callSid = body.CallSid || "";
  const duration = parseInt(body.RecordingDuration || "0", 10) || null;
  const row = {
    recordingSid,
    callSid,
    from,
    to,
    createdAt: new Date().toISOString(),
    durationSeconds: duration,
    transcription: "",
    transcriptionStatus: "pending",
  };
  const i = voicemailLog.findIndex((v) => v.recordingSid === recordingSid);
  if (i >= 0) voicemailLog[i] = { ...voicemailLog[i], ...row };
  else voicemailLog.push(row);
  if (voicemailLog.length > MAX_VOICEMAILS) voicemailLog.splice(0, voicemailLog.length - MAX_VOICEMAILS);
  saveVoicemailLogToDisk();
}

/**
 * @param {{ recordingSid: string, callSid: string, from: string, toLine: string }} ctx
 */
function scheduleVoicemailThankYouSms(ctx) {
  if ((process.env.TWILIO_VOICEMAIL_THANKYOU_SMS_ENABLED || "").trim() !== "1") return;
  const rawDelay = parseInt(process.env.TWILIO_VOICEMAIL_THANKYOU_SMS_DELAY_MS || "5000", 10);
  const delayMs = Number.isFinite(rawDelay) ? Math.max(0, rawDelay) : 5000;
  setTimeout(() => {
    deliverVoicemailThankYouSms(ctx).catch((e) =>
      console.error("voicemail thank-you SMS:", e.message || e)
    );
  }, delayMs);
}

/**
 * @param {{ recordingSid: string, callSid: string, from: string, toLine: string }} ctx
 */
async function deliverVoicemailThankYouSms(ctx) {
  const { recordingSid, callSid } = ctx;
  let from = (ctx.from || "").trim();
  const toLine = (ctx.toLine || "").trim();
  const template = (process.env.TWILIO_VOICEMAIL_THANKYOU_SMS_TEXT || "").trim();
  if (!template) {
    console.warn(
      "TWILIO_VOICEMAIL_THANKYOU_SMS_ENABLED=1 but TWILIO_VOICEMAIL_THANKYOU_SMS_TEXT is empty — skipping thank-you SMS."
    );
    return;
  }
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) return;

  const idx = voicemailLog.findIndex((v) => v.recordingSid === recordingSid);
  if (idx < 0) return;
  if (voicemailLog[idx].thankYouSmsSentAt) return;

  if (!from && callSid) {
    try {
      const client = twilio(accountSid, authToken);
      const call = await client.calls(callSid).fetch();
      from = (call.from || "").trim();
    } catch (e) {
      console.error("voicemail thank-you SMS: Call fetch failed:", e.message || e);
      return;
    }
  }
  if (!from) {
    console.warn("voicemail thank-you SMS: no caller number (From) for recording", recordingSid);
    return;
  }

  const smsFrom = (
    process.env.TWILIO_VOICEMAIL_THANKYOU_SMS_FROM ||
    process.env.TWILIO_DEFAULT_SMS_FROM ||
    ""
  ).trim();
  if (!smsFrom) {
    console.error(
      "voicemail thank-you SMS: set TWILIO_DEFAULT_SMS_FROM or TWILIO_VOICEMAIL_THANKYOU_SMS_FROM."
    );
    return;
  }

  const body = template
    .replaceAll("{from}", from)
    .replaceAll("{to}", toLine)
    .replaceAll("{line}", toLine);

  const client = twilio(accountSid, authToken);
  try {
    const msg = await client.messages.create({ to: from, from: smsFrom, body });
    const now = new Date().toISOString();
    const i2 = voicemailLog.findIndex((v) => v.recordingSid === recordingSid);
    if (i2 >= 0) {
      voicemailLog[i2].thankYouSmsSentAt = now;
      voicemailLog[i2].thankYouSmsSid = msg.sid;
      saveVoicemailLogToDisk();
    }
    const row = {
      id: msg.sid,
      from: smsFrom,
      to: from,
      body,
      direction: "outbound",
      at: now,
    };
    messageLog.push(row);
    if (messageLog.length > MAX_MESSAGES) messageLog.splice(0, messageLog.length - MAX_MESSAGES);
    saveMessageLogToDisk();
    console.log(`voicemail thank-you SMS sent to ${from} recording=${recordingSid} msg=${msg.sid}`);
  } catch (e) {
    console.error("voicemail thank-you SMS send failed:", e.message || e);
  }
}

/** Twilio recording completed (POST). */
function voiceRecordingStatus(req, res) {
  const status = (req.body.RecordingStatus || "").trim().toLowerCase();
  const sid = (req.body.RecordingSid || "").trim();
  if (sid) {
    console.log(
      `voice-recording-status RecordingSid=${sid} RecordingStatus=${status || "(empty)"} RecordingDuration=${req.body.RecordingDuration ?? ""}`
    );
  } else {
    console.warn("voice-recording-status: missing RecordingSid", { RecordingStatus: status });
  }
  if (sid && (status === "completed" || status === "")) {
    const to = pickMailboxTo(req.body, req);
    upsertVoicemailFromRecording({ ...req.body, To: to || req.body.To });
    scheduleVoicemailThankYouSms({
      recordingSid: sid,
      callSid: (req.body.CallSid || "").trim(),
      from: (req.body.From || "").trim(),
      toLine: to || String(req.body.To || "").trim(),
    });
  }
  res.type("text/xml").send(new twilio.twiml.VoiceResponse().toString());
}

/** Twilio <Record transcribeCallback> (POST). */
function voiceTranscription(req, res) {
  const recordingSid = req.body.RecordingSid || "";
  const text = (req.body.TranscriptionText || "").trim();
  const tStatus = (req.body.TranscriptionStatus || "").trim();
  const toLine = pickMailboxTo(req.body, req) || req.body.To || "";
  if (recordingSid) {
    const i = voicemailLog.findIndex((v) => v.recordingSid === recordingSid);
    if (i >= 0) {
      voicemailLog[i].transcription = text;
      voicemailLog[i].transcriptionStatus = tStatus || "completed";
      if (toLine) voicemailLog[i].to = toLine;
      saveVoicemailLogToDisk();
    } else {
      voicemailLog.push({
        recordingSid,
        callSid: req.body.CallSid || "",
        from: req.body.From || "",
        to: toLine,
        createdAt: new Date().toISOString(),
        durationSeconds: null,
        transcription: text,
        transcriptionStatus: tStatus || "completed",
      });
      if (voicemailLog.length > MAX_VOICEMAILS) voicemailLog.splice(0, voicemailLog.length - MAX_VOICEMAILS);
      saveVoicemailLogToDisk();
    }
  }
  res.type("text/xml").send(new twilio.twiml.VoiceResponse().toString());
}

app.post("/webhook/voice-incoming", express.urlencoded({ extended: false }), voiceIncomingPSTN);
app.get("/webhook/voice-incoming", voiceIncomingPSTN);
app.post("/webhook/voice-dial-complete", express.urlencoded({ extended: false }), voiceDialComplete);
app.post("/webhook/voice-recording-status", express.urlencoded({ extended: false }), voiceRecordingStatus);
app.post("/webhook/voice-transcription", express.urlencoded({ extended: false }), voiceTranscription);

async function handleVoicemailList(_req, res) {
  const diskSorted = [...voicemailLog].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  /** @type {Map<string, object>} */
  const bySid = new Map(diskSorted.map((r) => [r.recordingSid, { ...r }]));

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const mergeTwilio = (process.env.TWILIO_RECORDINGS_IN_VOICEMAIL_LIST || "1").trim() !== "0";

  if (mergeTwilio && accountSid && authToken) {
    try {
      const client = twilio(accountSid, authToken);
      const limit = Math.min(
        100,
        Math.max(1, parseInt(process.env.TWILIO_RECORDINGS_LIST_LIMIT || "50", 10) || 50)
      );
      const recs = await client.recordings.list({ limit });
      /** @type {Map<string, { from: string, to: string }>} */
      const callCache = new Map();
      for (const r of recs) {
        const sid = (r.sid || "").trim();
        if (!sid.startsWith("RE")) continue;
        if (bySid.has(sid)) continue;

        let from = "";
        let to = "";
        const cs = (r.callSid || "").trim();
        if (cs) {
          if (!callCache.has(cs)) {
            try {
              const call = await client.calls(cs).fetch();
              callCache.set(cs, { from: call.from || "", to: call.to || "" });
            } catch {
              callCache.set(cs, { from: "", to: "" });
            }
          }
          const c = callCache.get(cs) ?? { from: "", to: "" };
          from = c.from;
          to = c.to;
        }

        const durRaw = r.duration;
        const durationSeconds =
          durRaw === null || durRaw === undefined ? null : parseInt(String(durRaw), 10) || null;

        const createdAt = r.dateCreated ? new Date(r.dateCreated).toISOString() : new Date().toISOString();

        bySid.set(sid, {
          recordingSid: sid,
          callSid: cs,
          from,
          to,
          createdAt,
          durationSeconds,
          transcription: "",
          transcriptionStatus: (r.status || "completed").toString(),
          source: (r.source || "TwilioRecording").toString(),
        });
      }
    } catch (e) {
      console.error("Twilio recordings merge for /api/voicemails:", e.message || e);
    }
  }

  const merged = [...bySid.values()].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ voicemails: merged });
}

app.get("/api/voicemails", requireBearer, async (req, res) => {
  try {
    await handleVoicemailList(req, res);
  } catch (e) {
    console.error("handleVoicemailList:", e);
    res.status(500).json({ error: e.message || "voicemail list failed" });
  }
});

/** @param {import("express").Request} req @param {import("express").Response} res */
async function proxyVoicemailRecordingMedia(req, res) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const sid = (req.params.recordingSid || "").trim();
  if (!accountSid || !authToken || !sid.startsWith("RE")) {
    res.status(400).send("Bad request");
    return;
  }
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Recordings/${encodeURIComponent(sid)}.mp3`;
  const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
  try {
    const tw = await fetch(url, { headers: { Authorization: `Basic ${auth}` } });
    if (!tw.ok) {
      res.status(502).type("text/plain").send(`Twilio recording fetch failed: ${tw.status}`);
      return;
    }
    const buf = Buffer.from(await tw.arrayBuffer());
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "private, max-age=3600");
    res.send(buf);
  } catch (e) {
    console.error("voicemail audio proxy:", e);
    res.status(500).type("text/plain").send("Proxy error");
  }
}

app.get("/api/voicemails/:recordingSid/media", requireBearer, proxyVoicemailRecordingMedia);
app.get("/api/voicemail/:recordingSid/audio", requireBearer, proxyVoicemailRecordingMedia);

app.post("/webhook/sms", express.urlencoded({ extended: false }), (req, res) => {
  const From = req.body.From;
  const To = req.body.To;
  const Body = req.body.Body || "";
  const MessageSid = req.body.MessageSid || `local_${Date.now()}`;
  if (From && To) {
    const row = {
      id: MessageSid,
      from: From,
      to: To,
      body: Body,
      direction: "inbound",
      at: new Date().toISOString(),
    };
    messageLog.push(row);
    if (messageLog.length > MAX_MESSAGES) messageLog.splice(0, messageLog.length - MAX_MESSAGES);
    saveMessageLogToDisk();
  }
  const twiml = new twilio.twiml.MessagingResponse();
  res.type("text/xml").send(twiml.toString());
});

function handleMessagesList(_req, res) {
  res.json({
    messages: [...messageLog].sort((a, b) => new Date(a.at) - new Date(b.at)),
  });
}

app.get("/messages", requireBearer, handleMessagesList);
app.get("/api/sms/inbound", requireBearer, handleMessagesList);

app.get("/api/twilio/phone-numbers", requireBearer, async (_req, res) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) {
    res.status(503).json({ error: "Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN to list numbers." });
    return;
  }
  try {
    const client = twilio(accountSid, authToken);
    const raw = await client.incomingPhoneNumbers.list({ pageSize: 1000 });
    const numbers = raw.map((n) => {
      const cap = n.capabilities || {};
      return {
        sid: n.sid,
        phoneNumber: n.phoneNumber,
        friendlyName: n.friendlyName || "",
        capabilities: {
          voice: cap.voice === true,
          sms: cap.sms === true || cap.SMS === true,
          mms: cap.mms === true || cap.MMS === true,
        },
      };
    });
    res.json({ count: numbers.length, numbers });
  } catch (e) {
    console.error("incomingPhoneNumbers.list error:", e);
    res.status(500).json({ error: e.message || "Twilio list failed" });
  }
});

loadMessageLogFromDisk();
loadVoicemailLogFromDisk();
loadMissedCallSmsLogFromDisk();

app.listen(port, "0.0.0.0", () => {
  console.log(
    `TwilioCallApp backend on http://0.0.0.0:${port} (token, /api/voice-session, /api/voice-client-identity, /api/sms/*, /api/voicemails + /api/voicemails/:sid/media, /webhook/sms, /webhook/voice*, /api/twilio/phone-numbers)`
  );
});
