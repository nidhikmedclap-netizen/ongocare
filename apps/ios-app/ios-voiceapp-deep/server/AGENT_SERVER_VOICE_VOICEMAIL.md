# Server setup: Voice + per-number voicemail (handoff for operators / agents)

Use this checklist on the **machine that runs the TwilioCallApp Node backend**. Goal: PSTN callers reach the iOS app via `<Dial><Client>`; if nobody answers, callers hear a **voicemail greeting**, then **record**; transcripts and audio are available to the app via existing APIs.

---

## Stack summary

| Piece | Notes |
|--------|--------|
| **Production process** | Typically **`server/index.js`** via **`node index.js`** (e.g. Docker **`CMD ["node", "index.js"]`**). |
| **Recording list** | **`GET /api/voicemails`** (optional Bearer). |
| **Recording playback (canonical)** | **`GET /api/voicemails/:recordingSid/media`** — MP3 proxy; same Bearer rules as the list. |
| **Legacy playback path** | **`GET /api/voicemail/:recordingSid/audio`** — only if you still serve older clients; otherwise they **404** until the app is updated or you add an alias/redirect. |
| **Local / reference in this repo** | **`server/token-server.mjs`** (`npm start`) mirrors these routes for development. **Do not** aim production at **`token-server.mjs`** unless you deliberately ship it as the container entry and wire **`package.json`** / Docker accordingly. |

---

## 1. Required environment variables

Set these in `.env`, Docker `environment`, or the host process manager. **Do not commit secrets.**

| Variable | Required | Notes |
|----------|----------|--------|
| `PUBLIC_BASE_URL` | **Yes** for voicemail | Public origin **without** trailing slash, e.g. `https://voice.example.com`. Twilio must reach: `/webhook/voice-dial-complete`, `/webhook/voice-recording-status`, `/webhook/voice-transcription`. |
| `TWILIO_ACCOUNT_SID` | Yes (JWT + REST) | |
| `TWILIO_API_KEY_SID` | Yes (JWT) | |
| `TWILIO_API_KEY_SECRET` | Yes (JWT) | |
| `TWILIO_TWIML_APP_SID` | Yes (JWT) | TwiML App used for **outbound** SDK (`/webhook/voice`). |
| `TWILIO_VOICE_CLIENT_IDENTITY` | **Strongly recommended** | Alphanumeric/underscore; must match **`GET /api/voice-session`** identity (often `voice_client`). PSTN inbound dials `<Client>{this value}</Client>`. |
| `TWILIO_VOICE_PUSH_CREDENTIAL_SID` | For iOS incoming | VoIP push; without it Twilio can error on `<Client>`. |
| `TWILIO_AUTH_TOKEN` | For SMS, recording proxy, phone list, recordings merge | As used elsewhere in this project. |
| `TWILIO_VOICEMAIL_RING_TIMEOUT` | Optional | Seconds to ring app before voicemail (default **25**). |
| `TWILIO_VOICEMAIL_GREETING_DEFAULT` | Optional | Spoken prompt when dialed number is **not** listed in `voice-inbound-lines.json`. |
| `VOICE_INBOUND_LINES_PATH` | Optional | Absolute or cwd-relative path to JSON; default `data/voice-inbound-lines.json` under process cwd. |
| `VOICEMAIL_LOG_PATH` | Optional | Persisted voicemail index (default `data/voicemail-log.json`). |
| `APP_BEARER_TOKEN` | Optional | If set, protects `/api/voicemails`, **`/api/voicemails/.../media`**, etc.; app must send same Bearer. |
| `PORT` | Optional | Default `3001`. |
| `TWILIO_VOICEMAIL_THANKYOU_SMS_ENABLED` | Optional | Set to **`1`** to text the caller a few seconds after voicemail recording completes. |
| `TWILIO_VOICEMAIL_THANKYOU_SMS_TEXT` | With ↑ | Message body; optional placeholders **`{from}`** (caller), **`{to}`** / **`{line}`** (number they called). |
| `TWILIO_VOICEMAIL_THANKYOU_SMS_DELAY_MS` | Optional | Milliseconds before send (default **5000**). |
| `TWILIO_VOICEMAIL_THANKYOU_SMS_FROM` | Optional | SMS caller ID for that message; defaults to **`TWILIO_DEFAULT_SMS_FROM`**. |

After changes, **restart** the Node process (or container).

---

## 2. Per-number voicemail configuration (optional JSON)

1. Copy the example in this repo: `server/data/voice-inbound-lines.example.json`
2. Install on server as **`data/voice-inbound-lines.json`** next to the running app cwd **or** set `VOICE_INBOUND_LINES_PATH` to that file.
3. Each entry under `lines`:
   - **`number`**: E.164, e.g. `+15592344795` (must match Twilio inbound `To`).
   - **`voicemailGreeting`**: Text Twilio `Say` reads to the caller.
   - **`ringTimeoutSeconds`**: Optional; clamped 5–120.
   - **`clientIdentity`**: Optional; if omitted, server uses `TWILIO_VOICE_CLIENT_IDENTITY`. Only set per line if that line uses a **different** Voice client identity (rare for single app).

The server matches inbound **`To`** to `number` and applies greeting/timeout/identity. **Same** webhook URL can be used for all Twilio numbers.

---

## 3. Twilio Console (human step)

### Each **phone number** (PSTN inbound)

- **Phone Numbers → Active numbers → [number]**
- **Voice & Fax → A CALL COMES IN**: **Webhook**, **HTTP POST**
- URL: `https://<PUBLIC_BASE_URL_HOST>/webhook/voice-incoming`

Do **not** point the number at the TwiML App URL unless that app’s Voice URL is intentionally the same handler; typically the **number** uses `voice-incoming` and the **TwiML App** uses `voice` for SDK outbound.

### TwiML App (outbound from app)

- **A call comes in**: `https://<host>/webhook/voice` (POST)

---

## 4. Verification

1. `curl -sS https://<PUBLIC_BASE_URL>/health` — expect OK / JSON per your app.
2. From a phone, call a configured Twilio number:
   - App rings (if registered with correct identity + push).
   - If you **do not** answer: caller hears **greeting**, beep, can leave message.
3. In app **Recents → Recordings** (or `/api/voicemails` with Bearer if configured): new row should appear with correct **`to`** line when JSON/`toLine` routing is used.

---

## 5. Common failures

| Symptom | Likely cause |
|--------|----------------|
| “Could not connect” / generic error, no voicemail | `PUBLIC_BASE_URL` missing/wrong, webhook not HTTPS, or wrong inbound URL (not `/webhook/voice-incoming`). |
| App never rings | `TWILIO_VOICE_CLIENT_IDENTITY` mismatch vs JWT; missing push credential; wrong TwiML App vs number config. |
| Voicemail not in list | Bearer mismatch; `TWILIO_AUTH_TOKEN` missing; or **`index.js`** missing list/merge logic. |
| App lists recordings but play returns **404** | Missing **`GET /api/voicemails/:recordingSid/media`** on **`index.js`**, nginx not forwarding **`/api/voicemails/.../media`**, or client still calling legacy **`/api/voicemail/.../audio`**. Follow **`AGENT_SERVER_VOICEMAIL_AUDIO_ROUTE.md`**. |
| Thank-you SMS never sends | Follow **`AGENT_VOICEMAIL_THANKYOU_SMS.md`**. Typical causes: feature not enabled, empty template, missing **`From`**, or **`index.js`** missing the ported webhook logic. |

---

## 6. Code reference (this repo)

| File | Role |
|------|------|
| **`server/index.js`** | **Production entry** in your Docker/deploy setup — must register voice webhooks, **`GET /api/voicemails`**, and **`GET /api/voicemails/:recordingSid/media`** (and optional legacy **`/api/voicemail/.../audio`**). |
| **`server/token-server.mjs`** | **Reference / dev** server (`npm start` in this repo). Keep route names aligned with **`index.js`** or share modules so production and dev do not drift. |
| **`server/data/voice-inbound-lines.example.json`** | Example per-number voicemail JSON. |
| **`server/.env.example`** | Env template. |
| **`server/nginx.example.conf`** | Reverse-proxy example (catch-all to Node). |
| **`server/AGENT_SERVER_VOICEMAIL_AUDIO_ROUTE.md`** | Deep dive: media URL, 401 vs 404, deploy checks, `curl` verification. |
| **`server/AGENT_VOICEMAIL_THANKYOU_SMS.md`** | Enable thank-you SMS after voicemail: env, **`index.js`** vs **`token-server.mjs`**, verification. |

If production runs only **`index.js`**, port any new behavior from **`token-server.mjs`** into **`index.js`** (or extract a shared module) before relying on it in production.

**Handoff:** “Follow **`server/AGENT_VOICEMAIL_THANKYOU_SMS.md`** for post-voicemail texts.”

---

## 7. Sample voicemail greeting strings (for JSON)

Short:

- `Please leave a message after the tone.`

Standard:

- `Thanks for calling. No one is available. Please leave your name, number, and a brief message after the tone.`

With brand:

- `You have reached Example Company. We cannot take your call right now. Please leave a message after the tone and we will return your call.`

Paste into each line’s `voicemailGreeting` field; keep wording friendly to phone TTS (avoid odd punctuation).
