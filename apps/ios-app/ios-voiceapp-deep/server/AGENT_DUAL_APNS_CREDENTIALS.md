# Deploy: dual APNs push credentials (Xcode + TestFlight)

Copy the `resolvePushCredentialSid` / `apnsEnvironmentFromRequest` / updated `mintVoiceJwt` and `/api/voice-session` handler from `token-server.mjs` into production **`server/index.js`**, then set on the host `.env`:

```env
TWILIO_VOICE_PUSH_CREDENTIAL_SID_SANDBOX=CR...    # Twilio Sandbox VoIP, bundle com.ongocare.TwilioCallApp
TWILIO_VOICE_PUSH_CREDENTIAL_SID_PRODUCTION=CR... # Twilio Production VoIP, same bundle
```

Keep `TWILIO_VOICE_PUSH_CREDENTIAL_SID` only as fallback if you use a single install type.

Verify after deploy:

```bash
curl -s "https://ongovoiceapp.taskor.io/api/voice-session?apns=sandbox" | jq '{apns_environment, push_credential_sid}'
curl -s "https://ongovoiceapp.taskor.io/api/voice-session?apns=production" | jq '{apns_environment, push_credential_sid}'
```

The two `push_credential_sid` values must be **different** CR… SIDs.

Restart: `docker compose --env-file .env up -d --build`
