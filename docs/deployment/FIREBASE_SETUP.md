# Firebase Setup for Ongo Care (iOS)

Follow these steps once to fully connect the app to Firebase.

## 1) Create Firebase iOS app
- Open [Firebase Console](https://console.firebase.google.com/)
- Create/select project
- Add iOS app with bundle ID matching Xcode target bundle ID
- Download `GoogleService-Info.plist`

## 2) Add `GoogleService-Info.plist` into Xcode
- Drag `GoogleService-Info.plist` into the `Ongo Care` app group in Xcode
- Enable **Copy items if needed**
- Ensure target membership includes **Ongo Care**

Suggested location in repo:
- `Ongo Care/GoogleService-Info.plist`

## 3) Add Firebase SDK package
In Xcode:
- `File` -> `Add Package Dependencies...`
- URL: `https://github.com/firebase/firebase-ios-sdk`
- Add at least:
  - `FirebaseCore`

Optional commonly-used modules:
- `FirebaseAuth`
- `FirebaseFirestore`
- `FirebaseAnalytics`
- `FirebaseMessaging`
- `FirebaseStorage`

## 4) Verify startup
- Run app in simulator/device
- Check console: no Firebase configure errors

## 5) Current app initialization
`OngoCareApp` already contains guarded initialization:
- If `FirebaseCore` is linked, it runs `FirebaseApp.configure()`
- If not linked, app still builds and prints a setup reminder

## 6) Next integration options
After package setup, we can wire:
- Email/Google/Apple login with `FirebaseAuth`
- User profiles + progress data with `Firestore`
- Push notifications with `FirebaseMessaging`

## 7) Required auth console settings
- In Firebase Console -> Authentication -> Sign-in method:
  - Enable `Email/Password`
  - Enable `Google`
  - Enable `Apple`
- Re-download `GoogleService-Info.plist` after enabling providers, then replace the file in Xcode.

## 8) iOS capabilities and URL scheme
- In Xcode target -> `Signing & Capabilities`:
  - Add capability `Sign In with Apple`
- In target `Info` -> `URL Types`:
  - Add one URL Scheme equal to `REVERSED_CLIENT_ID` from `GoogleService-Info.plist`

Without these two items:
- Google Sign-In callback will fail
- Apple Sign-In button can appear but auth won't complete correctly on device

## 9) SendGrid (email: prescriptions, pharmacy, transactional)

In-app **clinical chat** uses **Firestore** (`clinicalChats` / `messages`), not SendGrid.

**SendGrid** is used by Cloud Functions for **outbound email** (e.g. `sendPrescriptionEmail`).

1. Create a [SendGrid](https://sendgrid.com/) account.
2. **Sender Authentication**: verify a **Single Sender** email or your domain (required to send).
3. **API Key**: Settings → API Keys → create a key with **Mail Send** permission.
4. In `functions/`, copy `functions/.env.example` → `functions/.env` and set:
   - `AGORA_APP_ID` / `AGORA_APP_CERTIFICATE` (for `agoraRtcToken`)
   - `SMTP_HOST=smtp.sendgrid.net`, `SMTP_PORT=587`, `SMTP_USER=apikey` (literal), `SMTP_PASS=<API key>`, `SMTP_FROM=<verified sender email>`
5. Deploy: `npx -y firebase-tools@latest deploy --only functions`

Reference: [SendGrid SMTP](https://docs.sendgrid.com/for-developers/sending-email/getting-started-smtp).
