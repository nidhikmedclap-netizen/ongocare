# Communications Service

OngoCare Communications Hub backend: receive Twilio Voice **call status** webhooks, persist call detail to Firestore, and on **completed** calls link contacts, conversations, and communication timeline events.

Inbound SMS, SMS delivery status webhooks, and outbound SMS send API are implemented. Voicemail webhooks are **not** implemented yet.

## Prerequisites

- Node.js 18+
- Firebase project **`ongo-dev`** with a service account JSON (Firestore enabled)
- Twilio account with Voice status callbacks pointed at this service

## Setup

```bash
cd backend/communications-service

# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env — set TWILIO_AUTH_TOKEN and paths/URLs for your environment

# 3. Place Firebase service account JSON (read-only is sufficient)
mkdir -p secrets
# secrets/firebase-service-account.json  ← download from Firebase Console

# 4. Run locally
npm run dev
```

Production-style run:

```bash
npm start
```

## Environment variables

| Variable | Description |
|----------|-------------|
| `PORT` | HTTP listen port (default `3102`) |
| `FIREBASE_PROJECT_ID` | Firebase project ID (`ongo-dev`) |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to service account JSON |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token (webhook signature validation) |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID (outbound SMS) |
| `TWILIO_API_KEY_SID` | Twilio API Key SID (preferred for outbound SMS) |
| `TWILIO_API_KEY_SECRET` | Twilio API Key Secret |
| `TWILIO_MESSAGING_SERVICE_SID` | Optional Messaging Service for outbound SMS |
| `TWILIO_SMS_FROM_NUMBER` | Fallback E.164 sender when no messaging service |
| `SMS_APP_API_KEY` | Optional static API key for `/api/sms/send` |
| `COMMUNICATIONS_PUBLIC_URL` | Public base URL **without** trailing slash, e.g. `https://communications.ongocare.com` |
| `COMMUNICATIONS_DEFAULT_ORG_SLUG` | Default org slug for seed script (default `ongo`) |
| `COMMUNICATIONS_ORG_NAME` | Display name for seeded organization |
| `ORG_PHONE_MAPPINGS` | Comma-separated `+E164=orgSlug` entries for `orgPhoneNumbers` seed |
| `HUB_AUTH_STRICT` | `true` enables org-scoped authorization (default `false` until rollout complete) |
| `ORG_MEMBERSHIPS` | Seed: `uid=orgSlug:role` comma-separated (`npm run seed:memberships`) |
| `HUB_SERVICE_ACCOUNTS` | Seed: `keyId=orgSlug1\|orgSlug2` comma-separated |
| `HUB_SERVICE_ACCOUNT_KEY_ID` | Service principal ID for API-key org scope lookup |
| `SERVICE_ACCOUNT_ORG_SLUGS` | Org scope when key ID set but not in `HUB_SERVICE_ACCOUNTS` |

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Service health + Firebase init status |
| `POST` | `/webhooks/twilio/calls` | Twilio Voice status callback |
| `POST` | `/webhooks/twilio/sms/inbound` | Twilio inbound SMS webhook |
| `POST` | `/webhooks/twilio/sms/status` | Twilio SMS delivery status callback |
| `POST` | `/api/sms/send` | Authenticated outbound SMS (Firebase Bearer or `SMS_APP_API_KEY`) |
| `GET` | `/api/conversations` | Inbox thread list (`lastActivityAt` desc, cursor pagination) |
| `GET` | `/api/conversations/:conversationId` | Thread detail + unified timeline |

Configure Twilio **Status Callback URL**:

```text
{COMMUNICATIONS_PUBLIC_URL}/webhooks/twilio/calls
```

## Firestore collections

### `organizations` (root) — Phase 4.2

Document ID = `orgSlug` (e.g. `ongo`, `esa`, `mmj`).

| Field | Description |
|-------|-------------|
| `orgSlug` | Tenant key (matches web app `users.orgSlug`) |
| `name` | Display name |
| `status` | `active`, `suspended`, `archived` |
| `product` | Product family (`weight_loss`, `esa`, `mmj`, …) |
| `defaultMessagingLineE164` | Default outbound SMS line |
| `defaultVoiceLineE164` | Default voice line (optional) |
| `createdAt` / `updatedAt` | Timestamps |

### `orgPhoneNumbers` (root) — Phase 4.2

Document ID = normalized E.164 (e.g. `+15592344795`). Maps Twilio lines to organizations.

| Field | Description |
|-------|-------------|
| `e164` | Business line in E.164 |
| `orgSlug` | Owning organization |
| `channel` | `sms`, `voice`, `sms_voice` |
| `status` | `active`, `inactive` |
| `isDefault` | Default line for the org |
| `label` | Human label (optional) |
| `twilioPhoneNumberSid` | Twilio PN SID (optional) |
| `createdAt` / `updatedAt` | Timestamps |

Hub link transactions resolve `orgSlug` from `businessLineE164` via this collection. Unmapped lines log a warning; webhooks still succeed (no `orgSlug` written).

### `orgMemberships` (root) — Phase 4.3

Document ID = `{uid}__{orgSlug}` (e.g. `TWUG5…__ongo`).

| Field | Description |
|-------|-------------|
| `uid` | Firebase Auth UID |
| `orgSlug` | Organization the user may access |
| `role` | `agent`, `admin`, or `viewer` |
| `permissions` | Hub capability strings (`inbox:read`, `sms:send`, …) |
| `status` | `active`, `suspended`, `revoked` |
| `grantedBy` | Admin UID or `system` |
| `grantedAt` / `createdAt` / `updatedAt` | Timestamps |

Server-written only. Hub authorization resolves allowed orgs from active memberships.

### `serviceAccounts` (root) — Phase 4.3

Document ID = `keyId` (metadata only; secrets stay in env / Secret Manager).

| Field | Description |
|-------|-------------|
| `keyId` | Service principal identifier |
| `orgSlugs` | Organizations this key may access |
| `role` | `service` |
| `permissions` | Hub capability strings |
| `status` | `active`, `revoked` |
| `description` | Human label |
| `createdAt` / `updatedAt` | Timestamps |

### `contacts` (root)

Canonical people/numbers. Lookup by `phonesE164` array-contains.

| Field | Description |
|-------|-------------|
| `displayName` | Display name (caller name or E.164 fallback) |
| `phones` | `[{ kind, number, e164, isPrimary }]` |
| `phonesE164` | Denormalized E.164 list for queries |
| `source` | `twilio`, `manual`, `import`, `ios_sync` |
| `lastSmsAt` | Latest inbound/outbound SMS timestamp |
| `lastCallAt` | Latest completed call timestamp |
| `lastActivityAt` | Latest activity across channels |
| `createdAt` / `updatedAt` | Timestamps |

### `conversations` (root)

One thread per external party × business line. Document ID = deterministic `conversationKey`:

```text
{peerE164}_{businessLineE164}
```

Example: `+12016325548_+12063383622`

| Field | Description |
|-------|-------------|
| `conversationKey` | Same as document ID |
| `contactId` | Linked `contacts/{id}` |
| `peerE164` | External party number |
| `businessLineE164` | Your Twilio line |
| `orgSlug` | Organization (resolved from `orgPhoneNumbers`) — Phase 4.2 |
| `lastMessagePreview` / `lastMessageAt` | Denormalized inbox fields |
| `lastCommunicationType` / `lastCommunicationId` | Latest timeline event |
| `callCount` / `smsCount` / `voicemailCount` | Per-channel event counters |

### `communications` (root)

Append-only timeline events. Idempotent IDs: `call_{CallSid}`, `sms_{MessageSid}`.

| Field | Description |
|-------|-------------|
| `conversationId` / `contactId` | Foreign keys |
| `orgSlug` | Denormalized from conversation / business line — Phase 4.2 |
| `type` | `sms`, `call`, `voicemail` |
| `channel` | `sms`, `voice` |
| `direction` | `inbound`, `outbound` |
| `providerSid` | Twilio CallSid / MessageSid |
| `preview` | Short summary for timeline |
| `metadata` | Type-specific payload (duration, recording, etc.) |
| `occurredAt` | When the event happened |

### `calls` (root)

Collection: `calls`  
Document ID: `CallSid`

| Field | Source |
|-------|--------|
| `callSid` | `CallSid` |
| `accountSid` | `AccountSid` |
| `applicationSid` | `ApplicationSid` |
| `from` | `From` |
| `to` | `To`, `Called`, `CallerId`, or child-leg REST enrichment |
| `caller` | `Caller` |
| `called` | `Called` |
| `callerId` | `CallerId` |
| `callerName` | `CallerName` or REST enrichment |
| `direction` | `Direction` |
| `status` | `CallStatus` |
| `durationSec` | `CallDuration` or REST enrichment |
| `billableDurationMin` | `Duration` |
| `answeredAt` | `Timestamp` on answered/in-progress, or child-leg `start_time` |
| `completedAt` | `Timestamp` on completed |
| `ringDurationSec` | Derived from parent/child REST `start_time` delta |
| `parentCallSid` | `ParentCallSid` |
| `childCallSid` | REST child-leg lookup |
| `recordingSid` | REST `/Recordings` |
| `recordingUrl` | REST `/Recordings` |
| `callbackSource` | `CallbackSource` |
| `sequenceNumber` | `SequenceNumber` |
| `contactId` | Set on completed via `CallLinkService` |
| `conversationId` | Set on completed via `CallLinkService` |
| `communicationId` | `communications/call_{CallSid}` summary event |
| `peerE164` / `businessLineE164` | Resolved party numbers |
| `orgSlug` | Organization (resolved from business line) — Phase 4.2 |
| `childFrom` | Child-leg `from` (REST enrichment) |
| `callType` | optional custom param |
| `createdAt` | server timestamp (set on create) |
| `updatedAt` | server timestamp (every write) |

## Organization foundation (Phase 4.2)

### Schema changes

- New collections: `organizations/{orgSlug}`, `orgPhoneNumbers/{e164}`
- New optional field `orgSlug` on `conversations`, `communications`, `calls`
- Conversation document IDs unchanged (`{peerE164}_{businessLineE164}`)
- Inbox API responses include `orgSlug` when present (additive; existing clients unaffected)
- No authorization changes; no `orgMemberships`; contacts unchanged

### Seed routing tables

```bash
# Set ORG_PHONE_MAPPINGS and/or TWILIO_SMS_FROM_NUMBER in .env, then:
npm run seed:org
```

Example `.env`:

```text
COMMUNICATIONS_DEFAULT_ORG_SLUG=ongo
ORG_PHONE_MAPPINGS=+15592344795=ongo,+12063383622=ongo
TWILIO_SMS_FROM_NUMBER=+15592344795
```

### Backfill existing documents

After seeding `orgPhoneNumbers`, backfill historical rows:

```bash
npm run backfill:org-slug
npm run backfill:org-slug -- --dry-run   # preview only
```

### Deployment sequence

1. Deploy hub code (Phase 4.2) to communications service
2. `pm2 restart ongocare-communications` (use clean env per ops runbook)
3. Run `npm run seed:org` on VPS with production `.env`
4. Run `npm run backfill:org-slug -- --dry-run`, then without `--dry-run`
5. Trigger test inbound SMS / completed call; confirm `orgSlug` on new writes
6. Future phase: org-based inbox authorization (replaces line allowlist)

## Membership seeding (Phase 4.3 Step 4)

Seeds multi-brand organizations (`ongo`, `esa`, `mmj`, `weightloss`), `orgMemberships`, and `serviceAccounts`. Does not enable strict auth or inbox filtering.

```bash
npm run seed:memberships -- --dry-run   # preview
npm run seed:memberships
```

Example `.env`:

```text
ORG_MEMBERSHIPS=TWUG5abc123=ongo:admin,TWUG5def456=esa:agent
HUB_SERVICE_ACCOUNT_KEY_ID=sms-app
HUB_SERVICE_ACCOUNTS=sms-app=ongo|esa|mmj|weightloss
```

See `DEPLOYMENT.md` for the full VPS procedure.

## Inbound SMS linking

On `POST /webhooks/twilio/sms/inbound` (after signature validation):

1. Resolve `peerE164` (`From`) and `businessLineE164` (`To`)
2. Resolve `orgSlug` from `orgPhoneNumbers/{businessLineE164}`
3. Transaction: contact (`lastSmsAt`, `lastActivityAt`), conversation (`smsCount++`, `lastMessageAt`, `orgSlug`), communication (`sms_{MessageSid}`)
4. Duplicate `MessageSid` retries are idempotent (no counter increment)

Configure Twilio phone number **Messaging** webhook:

```text
{COMMUNICATIONS_PUBLIC_URL}/webhooks/twilio/sms/inbound
```

## Unified inbox API

`GET /api/conversations` — cursor-paginated thread list sorted by `lastMessageAt` (exposed as `lastActivityAt`).

`GET /api/conversations/:conversationId` — conversation metadata, contact summary, and `communications` timeline ordered by `occurredAt` desc.

Auth: same as `/api/sms/send` (`checkAppAuth`).

## Outbound SMS send API

`POST /api/sms/send` with JSON body `{ "to": "+1…", "body": "…", "from": "+1…" }`.

- Auth: `Authorization: Bearer <Firebase ID token>` or static `SMS_APP_API_KEY`
- Sends via Twilio `messages.create()` with `statusCallback` → `/webhooks/twilio/sms/status`
- Transaction links `contacts`, `conversations`, `communications/sms_{MessageSid}`

## SMS delivery status callbacks

On `POST /webhooks/twilio/sms/status` (after signature validation):

1. Resolve `MessageSid` → `communications/sms_{MessageSid}`
2. Merge delivery status only (does **not** update contacts, conversations, or calls)
3. Supported statuses: `queued`, `sent`, `delivered`, `failed`, `undelivered`
4. Stores `status`, `metadata.errorCode`, `metadata.errorMessage`, `metadata.statusHistory`
5. Duplicate or regressive status updates are ignored (idempotent)

Configure per-message `statusCallback` on `messages.create` and/or Messaging Service status URL:

```text
{COMMUNICATIONS_PUBLIC_URL}/webhooks/twilio/sms/status
```

## Completed call linking

On `CallStatus=completed`, after REST enrichment:

1. Resolve `peerE164` and `businessLineE164` from webhook + child leg
2. Resolve `orgSlug` from `orgPhoneNumbers/{businessLineE164}`
3. Transaction: contact, conversation (`orgSlug`), communication (`call_{CallSid}`), `calls/{CallSid}` (`orgSlug`)
4. Increments `conversations.callCount` on new communication events

## Verify

```bash
curl -s http://localhost:3102/health | jq
```

Twilio sends `application/x-www-form-urlencoded` bodies with an `X-Twilio-Signature` header. Unsigned test posts will return `403 invalid_twilio_signature`.
