# Fix Twilio 52134 — Invalid APNs device token (incoming never reaches app)

## Symptom (from Twilio Console)

- Call to `client:voice_client` → **No Answer** / **Busy**, duration 0s
- Debugger error **52134** — **Invalid APNs device token**

The iOS app cannot show incoming UI because **Twilio never delivers the VoIP push** to the device.

## Root cause

Mismatch between:

1. **APNs environment of the installed app** (sandbox vs production), and  
2. **Twilio Push Credential** referenced by `TWILIO_VOICE_PUSH_CREDENTIAL_SID` in server `.env`

| How the app was installed | APNs environment | Twilio credential must be |
|---------------------------|------------------|---------------------------|
| Xcode Run (Debug) on device | **Sandbox (development)** | **Sandbox / Development** VoIP credential |
| **TestFlight** or App Store | **Production** | **Production** VoIP credential |

**Common mistake:** Incoming worked with Twilio **sandbox / test** push credential on **Xcode** installs. On **TestFlight**, the same server `.env` causes **52134** until `TWILIO_VOICE_PUSH_CREDENTIAL_SID` is a **Production** credential.

If you use a **Sandbox** push credential while the app is on **TestFlight** → **52134**.

## Fix steps

1. **Twilio Console** → Account → **Credentials** → **Push Credentials** → **Create** (or edit):
   - For Xcode testing: create **Apple VoIP — Sandbox/Development** with your app’s VoIP certificate or key (Bundle ID must match the iOS app).
   - For TestFlight: create **Production** credential separately.

2. Copy the credential **SID** (`CR…`) into server `.env`:
   ```env
   TWILIO_VOICE_PUSH_CREDENTIAL_SID=CRxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

3. Restart backend:
   ```bash
   cd /root/ongovoiceapp-taskor && docker compose --env-file .env up -d --build
   ```

4. Verify JWT includes push credential (on server):
   ```bash
   curl -s "https://ongovoiceapp.taskor.io/api/voice-session" | jq -r '.token' | cut -d. -f2 | base64 -d 2>/dev/null | jq '.grants.voice.push_credential_sid'
   ```
   Must print a `CR…` SID, not `null`.

5. On the **iPhone**: delete app → reinstall from Xcode → open app → login → wait 15s → Settings → **Re-register VoIP** → status should be **Registered OK**.

6. Call the Twilio number from another phone. Twilio log should show **ringing** to client, not 52134.

## Also verify

- `TWILIO_VOICE_CLIENT_IDENTITY=voice_client` (matches `<Client>voice_client</Client>` in inbound TwiML)
- Phone number Voice URL: `POST …/webhook/voice-incoming`
- `GET /webhook/voice` is only for TwiML App (outbound SDK)

## App-side test without inbound push

Settings → **Test incoming screen (UI only)** — verifies Accept/Decline UI without Twilio push.
