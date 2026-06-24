# Agent instructions: fix voicemail playback (404 on recording media)

Use this when the **iOS app** shows a playback error or `curl` to the **media** URL returns **404**, while **`GET /api/voicemails`** works (e.g. **401** without Bearer when `APP_BEARER_TOKEN` is set).

---

## Canonical playback path (production)

**Live route:** `GET /api/voicemails/:recordingSid/media`

- Returns **200** with **`Content-Type: audio/mpeg`** (Twilio recording MP3 proxied with account credentials).
- Same **`Authorization: Bearer`** rules as **`GET /api/voicemails`** when `APP_BEARER_TOKEN` is set.

---

## Legacy path (older clients only)

`GET /api/voicemail/:recordingSid/audio` is a **legacy** shape. If production only implements **`/media`**, that path will **404** until you either:

- **Update the client** to request `/api/voicemails/:recordingSid/media`, or  
- **Add a redirect or duplicate route** on the server (e.g. 307 from `/api/voicemail/.../audio` → `/api/voicemails/.../media`, or register both handlers).

---

## Symptom: 401 vs 404

| HTTP | Meaning |
|------|--------|
| **401** JSON (`Unauthorized`) | Request reached the app and **`requireBearer`** rejected it. The **route exists**. Fix Bearer or `APP_BEARER_TOKEN`. |
| **404** (often Express “Cannot GET …” HTML) | **No matching route** on the running server (stale deploy, wrong entry file, or nginx not forwarding this path). |

So: **404** on `/api/voicemails/.../media` means the handler is missing or traffic never hits Node. **404** on **`/api/voicemail/.../audio`** may mean the same, or production never added the legacy alias.

---

## Root causes

1. **`index.js` (production)** does not register `GET /api/voicemails/:recordingSid/media` (or it was never deployed).
2. **Nginx** proxies `/api/voicemails` (list) but not subpaths under `/api/voicemails/` (media). Use a catch-all for `/api/` to Node or an explicit `location` for `/api/voicemails/`. See **`server/nginx.example.conf`**.
3. **Client** still calls **`/api/voicemail/.../audio`** while the server only exposes **`/media`**.

---

## What to do on the server

1. **Confirm the live entry file**  
   Production should run **`node index.js`** from **`server/index.js`** (e.g. Docker `CMD ["node", "index.js"]`). **Do not** point production at **`token-server.mjs`** unless you intentionally add it to the image and set **`package.json`** / Docker **`CMD`** that way. This repo’s **`token-server.mjs`** is a **reference** implementation for local/dev; **`index.js`** must expose the same HTTP contract in production.

2. **Implement or port the handler** on **`index.js`**  
   Register **`GET /api/voicemails/:recordingSid/media`** with the same Twilio proxy logic (Basic auth to `Recordings/{sid}.mp3`, stream or buffer MP3, set `Content-Type: audio/mpeg`). Optionally keep **`GET /api/voicemail/:recordingSid/audio`** as an alias for older apps.

3. **Environment**  
   - `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` required for the proxy.  
   - If `APP_BEARER_TOKEN` is set, clients must send `Authorization: Bearer <value>`.

4. **Restart** the Node process or container after deploy.

5. **Nginx**  
   Ensure **`/api/voicemails/`** (including **`.../media`**) reaches the **same** upstream as **`GET /api/voicemails`**.

---

## Verification

Replace `<host>`, `<RecordingSid>` (Twilio **`RE...`**), and `<token>` if used.

**1. Route registered (auth)**

```bash
curl -sS -o /dev/null -w "%{http_code}\n" \
  "https://<host>/api/voicemails/<RecordingSid>/media"
```

When `APP_BEARER_TOKEN` is set, expect **401** (not **404**).

**2. Success**

```bash
curl -sS -o /dev/null -w "%{http_code}\n" \
  -H "Authorization: Bearer <token>" \
  "https://<host>/api/voicemails/<RecordingSid>/media"
```

Expect **200** and **`audio/mpeg`**.

**3. Other errors**

- **400** — bad SID (must start with **`RE`**) or missing Twilio env.  
- **502** — Twilio rejected the fetch; route works, fix credentials or SID.

---

## Security

Do not paste **`APP_BEARER_TOKEN`** or **`TWILIO_AUTH_TOKEN`** into tickets or chat. Rotate if exposed.

---

## Related docs

- **`AGENT_SERVER_VOICE_VOICEMAIL.md`** — voice + voicemail stack, env, Twilio Console, common failures.
- **`AGENT_VOICEMAIL_THANKYOU_SMS.md`** — optional SMS to caller after they leave a voicemail.

**Agent one-liner:** Follow this file for playback **404**s; follow **`AGENT_VOICEMAIL_THANKYOU_SMS.md`** for thank-you **SMS**.
