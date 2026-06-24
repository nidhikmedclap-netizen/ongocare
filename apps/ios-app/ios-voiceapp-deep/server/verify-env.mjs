#!/usr/bin/env node
/**
 * Validates a .env file for Voice JWT + production callbacks (no secret values printed).
 * Usage:
 *   node verify-env.mjs
 *   node verify-env.mjs /root/ongovoiceapp-taskor/.env
 *   node verify-env.mjs /root/ongovoiceapp-taskor/.env --production
 */
import fs from "fs";
import path from "path";

const REQUIRED_VOICE_JWT = [
  "TWILIO_ACCOUNT_SID",
  "TWILIO_API_KEY_SID",
  "TWILIO_API_KEY_SECRET",
  "TWILIO_TWIML_APP_SID",
];

/** Required when using --production (Voice alignment + Twilio REST + public callbacks). */
const RECOMMENDED_PRODUCTION = [
  "TWILIO_VOICE_CLIENT_IDENTITY",
  "PUBLIC_BASE_URL",
  "TWILIO_AUTH_TOKEN",
];

function parseEnvFile(filePath) {
  const abs = path.resolve(filePath);
  if (!fs.existsSync(abs)) {
    return { error: `File not found: ${abs}`, vars: {} };
  }
  const vars = {};
  const text = fs.readFileSync(abs, "utf8");
  for (let line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    vars[key] = val;
  }
  return { error: null, vars };
}

function main() {
  const args = process.argv.slice(2).filter((a) => a !== "--production");
  const production = process.argv.includes("--production");
  const envPath = args[0] || ".env";

  const { error, vars } = parseEnvFile(envPath);
  if (error) {
    console.error(error);
    process.exit(1);
  }

  const missingReq = REQUIRED_VOICE_JWT.filter((k) => !(vars[k] && String(vars[k]).trim()));
  const missingRec = RECOMMENDED_PRODUCTION.filter((k) => !(vars[k] && String(vars[k]).trim()));

  if (missingReq.length) {
    console.error("Missing or empty required variables for /api/voice-session and /token:");
    for (const k of missingReq) console.error(`  - ${k}`);
    process.exit(1);
  }

  console.log(`OK: ${path.resolve(envPath)} has all Voice JWT variables (${REQUIRED_VOICE_JWT.join(", ")}).`);

  const pushSid = vars.TWILIO_VOICE_PUSH_CREDENTIAL_SID && String(vars.TWILIO_VOICE_PUSH_CREDENTIAL_SID).trim();
  const pushSandbox =
    vars.TWILIO_VOICE_PUSH_CREDENTIAL_SID_SANDBOX && String(vars.TWILIO_VOICE_PUSH_CREDENTIAL_SID_SANDBOX).trim();
  const pushProd =
    vars.TWILIO_VOICE_PUSH_CREDENTIAL_SID_PRODUCTION &&
    String(vars.TWILIO_VOICE_PUSH_CREDENTIAL_SID_PRODUCTION).trim();
  if (!pushSid && !pushSandbox && !pushProd) {
    console.warn(
      "iOS incoming (VoIP): no push credential SIDs set — Twilio may return 52004. Set TWILIO_VOICE_PUSH_CREDENTIAL_SID_SANDBOX and TWILIO_VOICE_PUSH_CREDENTIAL_SID_PRODUCTION (recommended)."
    );
  } else if (!pushSandbox || !pushProd) {
    console.warn(
      "iOS incoming: set BOTH TWILIO_VOICE_PUSH_CREDENTIAL_SID_SANDBOX (Xcode) and TWILIO_VOICE_PUSH_CREDENTIAL_SID_PRODUCTION (TestFlight) or one install type will get Twilio 52134."
    );
  }

  if (missingRec.length) {
    console.warn(
      "Warning — set these for full production (PSTN <Client> match, HTTPS callbacks to Twilio, SMS/recording REST):"
    );
    for (const k of missingRec) console.warn(`  - ${k}`);
    if (production) {
      console.error("Exiting with error (--production requires TWILIO_VOICE_CLIENT_IDENTITY, PUBLIC_BASE_URL, TWILIO_AUTH_TOKEN).");
      process.exit(1);
    }
  } else {
    console.log(`OK: recommended production vars present (${RECOMMENDED_PRODUCTION.join(", ")}).`);
  }

  if (String(vars.TWILIO_VOICEMAIL_THANKYOU_SMS_ENABLED || "").trim() === "1") {
    if (!String(vars.TWILIO_VOICEMAIL_THANKYOU_SMS_TEXT || "").trim()) {
      console.warn(
        "TWILIO_VOICEMAIL_THANKYOU_SMS_ENABLED=1 but TWILIO_VOICEMAIL_THANKYOU_SMS_TEXT is empty — thank-you SMS will be skipped at runtime."
      );
    }
    const smsFrom =
      String(vars.TWILIO_VOICEMAIL_THANKYOU_SMS_FROM || "").trim() ||
      String(vars.TWILIO_DEFAULT_SMS_FROM || "").trim();
    if (!smsFrom) {
      console.warn(
        "TWILIO_VOICEMAIL_THANKYOU_SMS_ENABLED=1 but neither TWILIO_VOICEMAIL_THANKYOU_SMS_FROM nor TWILIO_DEFAULT_SMS_FROM is set — thank-you SMS will fail until you set one."
      );
    }
  }

  if (String(vars.TWILIO_MISSED_CALL_SMS_ENABLED || "").trim() === "1") {
    if (!String(vars.TWILIO_MISSED_CALL_SMS_TEXT || "").trim()) {
      console.warn(
        "TWILIO_MISSED_CALL_SMS_ENABLED=1 but TWILIO_MISSED_CALL_SMS_TEXT is empty — missed-call SMS will be skipped at runtime."
      );
    }
    const smsFrom = String(vars.TWILIO_DEFAULT_SMS_FROM || "").trim();
    if (!smsFrom) {
      console.warn(
        "TWILIO_MISSED_CALL_SMS_ENABLED=1 but TWILIO_DEFAULT_SMS_FROM is unset — server will try to send from the dialed line; set TWILIO_DEFAULT_SMS_FROM as a fallback."
      );
    }
  }
}

main();
