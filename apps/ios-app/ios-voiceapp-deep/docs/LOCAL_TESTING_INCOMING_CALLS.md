# Test incoming calls without App Store Connect

## 1. Test the in-app UI (30 seconds)

On your iPhone (Xcode install is fine):

1. Open app → **Settings** → scroll to **Incoming calls (VoIP)**
2. Tap **Test incoming screen (UI only)**

You should see the full-screen Accept / Decline UI. If this works, your UI code is fine; real inbound still needs VoIP push from Twilio.

## 2. Test real inbound (needs correct APNs credential)

Your Twilio log showed **52134 Invalid APNs device token** — fix on server/Twilio Console first. See [server/AGENT_FIX_TWILIO_52134_APNS.md](../server/AGENT_FIX_TWILIO_52134_APNS.md).

After fix:

1. Settings → **Re-register VoIP** → status **Registered OK**
2. **JWT push credential** = **Present in token**
3. Call your Twilio number from another phone (not your own Twilio line)

## 3. Fast install options (no App Store review wait)

| Method | Time | Notes |
|--------|------|--------|
| **Xcode → Run on device** | Minutes | Uses **sandbox** APNs; Twilio Push Credential must be **Development/Sandbox** |
| **TestFlight Internal Testing** | Hours (not weeks) | Uses **production** APNs; separate Twilio **Production** credential |
| App Store | Days/weeks | Same as TestFlight for push |

## 4. What we cannot automate

An agent cannot receive VoIP pushes on your physical iPhone. Only you can validate after the Twilio **52134** credential mismatch is fixed.
