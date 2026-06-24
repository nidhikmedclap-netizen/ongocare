# Agent instructions: thank-you SMS after voicemail

When a PSTN caller leaves a voicemail, the backend can send them a **delayed SMS** with your template. Implementation lives in **`token-server.mjs`** (`scheduleVoicemailThankYouSms`, `deliverVoicemailThankYouSms`, called from **`POST /webhook/voice-recording-status`** after a **completed** recording).

**Agent one-liner:** Enable the env vars below on the host that runs the Voice webhooks, restart Node, then test with a real call.

---

## 1. Code on the server

| If production runs… | Action |
|---------------------|--------|
| **`token-server.mjs`** (this repo `npm start` / some Docker images) | Deploy the latest file from this repo; no extra route changes. |
| **`server/index.js`** (common Docker `CMD ["node", "index.js"]`) | Port the thank-you logic from **`token-server.mjs`** into **`index.js`**: after voicemail is saved on recording **completed**, schedule delayed send and call Twilio **`messages.create`** the same way. Missing this = no texts. |

---

## 2. Environment variables (`.env` or container env)

Set on the **same** process that handles **`/webhook/voice-recording-status`**:

| Variable | Required | Notes |
|----------|----------|--------|
| `TWILIO_VOICEMAIL_THANKYOU_SMS_ENABLED` | To turn on | Must be **`1`**. If unset or anything else, feature is off. |
| `TWILIO_VOICEMAIL_THANKYOU_SMS_TEXT` | Yes when enabled | Message body. Placeholders: **`{from}`** (caller E.164), **`{to}`** / **`{line}`** (number they called). |
| `TWILIO_AUTH_TOKEN` | Yes | Same as rest of app; used for `messages.create`. |
| `TWILIO_ACCOUNT_SID` | Yes | Same as rest of app. |
| `TWILIO_DEFAULT_SMS_FROM` | Yes for SMS | Messaging-capable Twilio number (or Messaging Service SID if your code supports it — this handler uses a number in `from`). |
| `TWILIO_VOICEMAIL_THANKYOU_SMS_FROM` | Optional | Overrides **`TWILIO_DEFAULT_SMS_FROM`** for this message only. |
| `TWILIO_VOICEMAIL_THANKYOU_SMS_DELAY_MS` | Optional | Milliseconds before send; default **5000**. |

After edits: **restart** Node / redeploy the container.

Validate (no secrets printed):

```bash
node /path/to/TwilioCallApp/server/verify-env.mjs /path/to/.env
```

If `TWILIO_VOICEMAIL_THANKYOU_SMS_ENABLED=1`, the script **warns** when text or From is missing.

---

## 3. Twilio / compliance

- The **From** number must be allowed to send SMS to the caller’s country/carrier (10DLC / registration where required).
- Caller ID must be a **valid** E.164; anonymous or invalid callers may not receive SMS (check logs).

---

## 4. Verification

1. **Logs:** After leaving a voicemail, within delay + a few seconds you should see a line like:  
   `voicemail thank-you SMS sent to +1… recording=RE… msg=SM…`
2. **Failures:** Look for `voicemail thank-you SMS send failed:` or warnings about empty template / missing From.
3. **Idempotency:** The same **`RecordingSid`** should not trigger two sends; voicemail log rows store **`thankYouSmsSentAt`** / **`thankYouSmsSid`**.

---

## 5. Related docs

- **`AGENT_SERVER_VOICE_VOICEMAIL.md`** — voice webhooks, env table, common failures.
- **`server/.env.example`** — commented examples for these variables.
