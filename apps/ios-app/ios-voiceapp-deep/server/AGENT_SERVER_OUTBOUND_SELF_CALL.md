# Block outbound calls to your own Twilio line (voicemail loop)

## Symptom

App outbound call to `5592344795` / `+15592344795` rings briefly, then plays **"no one is available"** and disconnects.

## Root cause

The destination is the **same Twilio number** configured for inbound (`voice-inbound-lines.json` / phone number webhook). Outbound `<Dial><Number>` hits your number → **inbound** flow → ring client → voicemail.

This is expected telephony behavior, not a broken outbound route.

## Fix (port to production `server/index.js`)

1. Add `destinationIsOwnedInboundLine(to)` (compare `to` against `voice-inbound-lines.json` and `TWILIO_DEFAULT_VOICE_FROM` / `TWILIO_DEFAULT_SMS_FROM` using existing E.164 match helper).

2. In outbound TwiML handler (`voiceOutboundTwiML` or equivalent), **before** `<Dial><Number>`:

   ```javascript
   if (numbersMatchE164(to, callerId) || destinationIsOwnedInboundLine(to)) {
     console.warn(`voice-outbound blocked self-call to owned line ${to}`);
     vr.say({ voice: "alice" }, "You cannot call your own business line from this app. Please dial an external phone number.");
     return res.type("text/xml").send(vr.toString());
   }
   ```

3. Log each outbound webhook: `voice-outbound To=… CallerId=… From=…`

4. Restart: `docker compose --env-file .env up -d --build`

## Verify

- POST `/webhook/voice` with `To=+15592344795&CallerId=+15592344795` → TwiML `<Say>` (no `<Dial>`).
- App blocks same number before connect with on-screen error.

## Test outbound correctly

Call an **external** number (your mobile), not your Twilio line `+15592344795`.

Reference implementation: `server/token-server.mjs` in this repo.
