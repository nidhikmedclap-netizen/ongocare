# OngoCare Communications Hub — Deployment Guide

Operations reference for deploying the Communications Hub (`communications.ongocare.com`) from the VPS.

Repository: `medclap/ongocare`  
Service path: `/opt/ongocare/communications-service/backend/communications-service`  
PM2 process: `ongocare-communications`  
Listen port: `3102`

---

## Branch strategy

| Branch | Role |
|--------|------|
| **`main`** | Production. Promote from `development` only after production sign-off. |
| **`development`** | Integration branch. **All hub deployments use this branch.** |
| **`feature/*`** | Short-lived feature work. Merge into `development` after verification. |

### Feature branch examples

- `feature/voicemail-hub`
- `feature/auth-scoping`
- `feature/inbox-ui`
- `feature/weightloss-crm`

### Development workflow

1. Branch from `development`:

   ```bash
   git checkout development
   git pull origin development
   git checkout -b feature/<feature-name>
   ```

2. Develop and commit on the feature branch.

3. Push the feature branch:

   ```bash
   git push origin feature/<feature-name>
   ```

4. Merge into `development` after verification.

5. **Deploy only from `development`.**

6. Promote `development` → `main` only after production sign-off.

---

## Deployment source of truth

**Deploy from `development` only.**

Do **not** deploy from feature branches (including `feature/communications-hub`, which is frozen).

| Branch | Deploy? |
|--------|---------|
| `development` | **Yes** |
| `feature/*` | No |
| `main` | Production promotion only (separate process) |

`development` contains all Communications Hub work through Phase 4.2 and is the integration branch for ongoing hub work.

---

## VPS deployment procedure

### Prerequisites

- VPS checkout at `/opt/ongocare/communications-service`
- Git remote uses `github-ongocare` SSH alias (`ongocare_deploy` key)
- `.env` configured in `backend/communications-service/`
- PM2 process `ongocare-communications` registered

### 1. Update code

```bash
cd /opt/ongocare/communications-service

git fetch origin
git checkout development
git pull origin development
```

### 2. Verify branch

```bash
git branch --show-current
```

Expected:

```text
development
```

### 3. Verify latest commits

```bash
git log --oneline -5
```

Confirm Communications Hub commits are present (through `1edc86f` minimum).

### 4. Install dependencies (if `package.json` changed)

```bash
cd backend/communications-service
npm install
```

### 5. Restart Communications Hub

See [PM2 restart commands](#pm2-restart-commands) below.

### 6. Verify health

```bash
curl -s https://communications.ongocare.com/health
```

Expected:

```json
{
  "ok": true,
  "service": "communications-service",
  "firebaseAdmin": true
}
```

---

## PM2 restart commands

Use a **clean environment** so stale shell variables do not override `.env`:

```bash
env -u GOOGLE_APPLICATION_CREDENTIALS \
    -u FIREBASE_PROJECT_ID \
    -u VOICE_TOKEN_PORT \
  pm2 restart ongocare-communications \
    --cwd /opt/ongocare/communications-service/backend/communications-service
```

### First-time start

```bash
cd /opt/ongocare/communications-service/backend/communications-service

env -u GOOGLE_APPLICATION_CREDENTIALS \
    -u FIREBASE_PROJECT_ID \
    -u VOICE_TOKEN_PORT \
  pm2 start server.js --name ongocare-communications
```

### Inspect process

```bash
pm2 describe ongocare-communications
pm2 logs ongocare-communications --lines 50
```

---

## Firestore org seeding procedure

Required after Phase 4.2 deploy (or when adding new Twilio numbers / organizations).

### 1. Configure `.env`

```text
COMMUNICATIONS_DEFAULT_ORG_SLUG=ongo
COMMUNICATIONS_ORG_NAME=Ongo Weight Loss
ORG_PHONE_MAPPINGS=+15592344795=ongo,+12063383622=ongo
TWILIO_SMS_FROM_NUMBER=+15592344795
```

`ORG_PHONE_MAPPINGS` format: `+E164=orgSlug` comma-separated.  
`TWILIO_SMS_FROM_NUMBER` is also seeded if not listed in mappings.

### 2. Seed routing tables

```bash
cd /opt/ongocare/communications-service/backend/communications-service
npm run seed:org
```

Creates:

- `organizations/{orgSlug}`
- `orgPhoneNumbers/{e164}`

### 3. Backfill historical documents

```bash
npm run backfill:org-slug -- --dry-run   # preview
npm run backfill:org-slug                # apply
```

Writes `orgSlug` to existing `conversations`, `communications`, and `calls` where `businessLineE164` maps to an org.

### 4. Verify new writes

Trigger inbound SMS or a completed call. Confirm `orgSlug` is set on:

- `conversations/{id}`
- `communications/{id}`
- `calls/{CallSid}`

---

## Pre-deployment checklist

- [ ] `git status` clean (no uncommitted changes on VPS)
- [ ] On `development` branch
- [ ] `git pull origin development` completed
- [ ] Hub commits present (`1edc86f` or later for Phase 4.2)
- [ ] `npm install` run if dependencies changed
- [ ] `.env` has Twilio credentials (`TWILIO_AUTH_TOKEN`, `TWILIO_ACCOUNT_SID`, etc.)
- [ ] Firebase credentials path valid (`GOOGLE_APPLICATION_CREDENTIALS`)
- [ ] `SMS_APP_API_KEY` set if iOS/static clients use it
- [ ] Org mappings seeded if new numbers added (`npm run seed:org`)
- [ ] PM2 process exists and is not in errored state

---

## Post-deployment verification checklist

### Health

- [ ] `GET /health` returns `{ "ok": true }`
- [ ] `firebaseAdmin: true` in health response

### Voice

- [ ] Outbound SDK call completes
- [ ] `calls/{CallSid}` document created
- [ ] `contactId`, `conversationId`, `communicationId` linked on completed call
- [ ] `communications/call_{CallSid}` timeline event exists

### SMS

- [ ] `POST /api/sms/send` succeeds (authenticated)
- [ ] `communications/sms_{MessageSid}` created
- [ ] Status callback received at `/webhooks/twilio/sms/status`
- [ ] Status progresses to `delivered` (or expected terminal state)

### Inbox API

- [ ] `GET /api/conversations` returns thread list
- [ ] `GET /api/conversations/:id` returns timeline
- [ ] Pagination cursors work (`nextCursor`)

### Organization routing (Phase 4.2+)

- [ ] `orgSlug` written on new `conversations`
- [ ] `orgSlug` written on new `communications`
- [ ] `orgSlug` written on new `calls`
- [ ] `orgPhoneNumbers/{e164}` maps each live Twilio line

---

## Rollback procedure

**Requires approval before executing.**

### 1. Identify stable commit

```bash
cd /opt/ongocare/communications-service
git log --oneline -20
```

### 2. Reset `development` to stable commit

```bash
git checkout development
git reset --hard <stable_commit>
git push --force origin development
```

### 3. Restart PM2

```bash
env -u GOOGLE_APPLICATION_CREDENTIALS \
    -u FIREBASE_PROJECT_ID \
    -u VOICE_TOKEN_PORT \
  pm2 restart ongocare-communications \
    --cwd /opt/ongocare/communications-service/backend/communications-service
```

### 4. Verify health and smoke tests

Run the [post-deployment verification](#post-deployment-verification-checklist) checklist.

> **Note:** Firestore data written by newer versions is not automatically reverted. Rollback affects application code only.

---

## Current baseline

| Item | Value |
|------|-------|
| **Deploy branch** | `development` |
| **Communications Hub integration commit** | `9dd9032` — Merge `feature/communications-hub` into `development` |
| **Phase 4.2 commit** | `1edc86f` — Organization foundation (`orgSlug`, `organizations`, `orgPhoneNumbers`) |
| **Hub status** | Phase 4.2 complete |
| **Frozen branch** | `feature/communications-hub` — do not deploy |

### Phase 4.3 (in progress)

| Step | Status |
|------|--------|
| Firestore indexes for `orgSlug` inbox + `orgMemberships` | Defined in `backend/integrations/firebase/firestore.indexes.json` — **deploy required** |
| `orgMemberships` / `serviceAccounts` schema | In hub code (repos + models) |
| `HUB_AUTH_STRICT` | Default **`false`** — shadow mode logs only; set `true` to deny empty org scope |
| `resolveOrgAccess` middleware | Wired on `/api/*` after `checkAppAuth` (Step 3) |
| Membership seed script | `npm run seed:memberships` (Step 4) |
| Inbox org filtering | `GET /api/conversations` + detail (Step 5) |
| `HUB_SERVICE_ACCOUNT_KEY_ID` | Optional `serviceAccounts/{keyId}` lookup for API keys |

Deploy indexes from a machine with Firebase CLI access:

```bash
cd backend/integrations/firebase
firebase deploy --only firestore:indexes --project ongo-dev-d5735
```

Do **not** set `HUB_AUTH_STRICT=true` until memberships are seeded and shadow-mode testing passes.

---

## Firestore membership seeding procedure (Phase 4.3 Step 4)

Run after Phase 4.2 org seed (`npm run seed:org`) and before enabling strict auth or inbox org filtering.

### Prerequisites

- Firebase credentials valid (`GOOGLE_APPLICATION_CREDENTIALS`)
- `organizations/ongo` exists (from `seed:org`) or will be created by membership seed
- Agent Firebase UIDs known (from Firebase Auth / `users` collection)
- `HUB_AUTH_STRICT=false` (default) — seeding does not change enforcement mode

### 1. Configure `.env`

```text
# Multi-brand org catalog (seeded automatically): ongo, esa, mmj, weightloss

# User memberships: uid=orgSlug:role (role defaults to agent)
ORG_MEMBERSHIPS=TWUG5abc123=ongo:admin,TWUG5def456=ongo:agent,TWUG5ghi789=esa:viewer

# Service account metadata (secrets stay in env)
HUB_SERVICE_ACCOUNT_KEY_ID=sms-app
SERVICE_ACCOUNT_ORG_SLUGS=ongo|esa|mmj|weightloss
HUB_SERVICE_ACCOUNTS=sms-app=ongo|esa|mmj|weightloss
```

**Membership format:** `uid=orgSlug:role` comma-separated.

| Role | Hub capabilities |
|------|-------------------|
| `admin` | inbox read/write, SMS send, calls read |
| `agent` | inbox read/write, SMS send, calls read |
| `viewer` | inbox read, calls read |

**Service account format:** `keyId=orgSlug1|orgSlug2` comma-separated.  
If `HUB_SERVICE_ACCOUNT_KEY_ID` is set but omitted from `HUB_SERVICE_ACCOUNTS`, the script seeds it using `SERVICE_ACCOUNT_ORG_SLUGS` (falls back to `COMMUNICATIONS_DEFAULT_ORG_SLUG`).

### 2. Preview (dry run)

```bash
cd /opt/ongocare/communications-service/backend/communications-service
npm run seed:memberships -- --dry-run
```

### 3. Apply seed

```bash
npm run seed:memberships
```

Creates or updates:

- `organizations/{orgSlug}` for `ongo`, `esa`, `mmj`, `weightloss`
- `orgMemberships/{uid}__{orgSlug}`
- `serviceAccounts/{keyId}`

Idempotent: re-running updates existing docs; `createdAt` / `grantedAt` preserved on membership updates.

### 4. Wire service account lookup (optional)

Set on the VPS `.env` so API-key auth resolves org scope from Firestore instead of legacy fallback:

```text
HUB_SERVICE_ACCOUNT_KEY_ID=sms-app
```

Restart PM2 after changing `.env`.

### 5. Verify seed

```bash
# Firebase CLI or Admin script — confirm doc counts
# orgMemberships: one doc per uid+org pair
# serviceAccounts: one doc per keyId

# Shadow-mode API check (HUB_AUTH_STRICT=false — must not block)
curl -s -H "Authorization: Bearer $SMS_APP_API_KEY" \
  https://communications.ongocare.com/api/conversations | head -c 200

pm2 logs ongocare-communications --lines 30 | grep hub-auth
```

Expected shadow logs after Firebase user requests:

- Active membership → no `missing_membership` / `would_deny`
- No membership → `missing_membership` + `would_deny` (logged only, not blocked)

### 6. What this step does **not** do

- No inbox `orgSlug` filtering (Step 5 — see below)
- No `HUB_AUTH_STRICT=true` enforcement (Step 8)
- No changes to webhook or SMS write paths

---

## Inbox organization filtering (Phase 4.3 Step 5)

Requires membership seed (Step 4) for Firebase users. API-key principals resolve org scope from `serviceAccounts` or legacy `COMMUNICATIONS_DEFAULT_ORG_SLUG`.

### Behavior

| Principal | `GET /api/conversations` | `GET /api/conversations/:id` |
|-----------|--------------------------|------------------------------|
| Superadmin | All conversations | Unrestricted |
| Non-superadmin with org scope | `orgSlug ∈ allowedOrgSlugs` | Allowed if conversation org in scope |
| Empty org scope + `HUB_AUTH_STRICT=false` | All conversations (shadow) | Allowed; `would_deny` logged at middleware |
| Empty org scope + `HUB_AUTH_STRICT=true` | **403** at middleware | **403** at middleware |
| Out-of-scope conversation + strict | Hidden from list | **403** `hub_forbidden` |
| Out-of-scope conversation + shadow | Hidden from list | **200**; `would_deny` logged |

### Firestore index required

Deploy before enabling strict mode at scale:

```bash
cd backend/integrations/firebase
firebase deploy --only firestore:indexes --project ongo-dev-d5735
```

Index: `conversations` — `orgSlug` ASC, `lastMessageAt` DESC, `__name__` DESC

### Verify after deploy

```bash
# API key (legacy service scope, typically ongo only)
curl -s -H "Authorization: Bearer $SMS_APP_API_KEY" \
  https://communications.ongocare.com/api/conversations | jq '.conversations[].orgSlug' | sort -u

# Shadow logs
pm2 logs ongocare-communications --lines 50 | grep hub-auth
```

### Not in scope (Step 5)

- `POST /api/sms/send` org gates (Step 6)
- Webhook changes
- Flipping `HUB_AUTH_STRICT=true` globally (Step 8)

---

## Quick reference

```bash
# Full deploy
cd /opt/ongocare/communications-service
git fetch origin && git checkout development && git pull origin development
env -u GOOGLE_APPLICATION_CREDENTIALS -u FIREBASE_PROJECT_ID -u VOICE_TOKEN_PORT \
  pm2 restart ongocare-communications \
  --cwd backend/communications-service
curl -s https://communications.ongocare.com/health | jq

# Org seed (Phase 4.2+)
cd backend/communications-service
npm run seed:org
npm run backfill:org-slug

# Membership seed (Phase 4.3 Step 4)
npm run seed:memberships -- --dry-run
npm run seed:memberships

# Chat widget build (Phase 5.1)
cd ../../apps/chat-widget
npm install
npm run build
```

---

## Phase 5.1 — Website Chat Widget

### Build widget bundle

```bash
cd /opt/ongocare/communications-service/apps/chat-widget
npm install
npm run build
```

Output is written to `backend/communications-service/public/widget/ongocare-chat.js`.

Commit the built asset with the widget source, or rebuild on the VPS after each deploy.

### Deploy

1. Pull `development` on the VPS.
2. Build the widget (commands above).
3. Restart PM2 (`ongocare-communications`).
4. Optional: re-seed chat site branding — `npm run seed:chat-sites` in `backend/communications-service`.

### Verify

```bash
curl -sI https://communications.ongocare.com/widget/ongocare-chat.js | head
curl -s https://communications.ongocare.com/widget/embed.html | head
```

### Embed snippet

```html
<script>
  window.OngoChat = window.OngoChat || { q: [] };
  window.OngoChat.init = function (config) {
    window.OngoChat.q.push(config);
  };
</script>
<script src="https://communications.ongocare.com/widget/ongocare-chat.js" async></script>
<script>
  window.OngoChat.init({ siteKey: "weightloss-main" });
</script>
```

The customer site origin must match a domain on the `chatSites` document. For local testing set `CHAT_ORIGIN_BYPASS=true` on the service.

### Widget APIs

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/chat/widget/bootstrap` | Origin allowlist |
| POST | `/api/chat/sessions` | Visitor JWT |
| GET | `/api/chat/sessions/:sessionId/messages` | Visitor JWT (polling) |
| POST | `/api/chat/sessions/:sessionId/messages` | Visitor JWT |

---

## Phase 5.3 — Chat Analytics & Lead Attribution

See `channels/chat/ANALYTICS.md` for full API contracts and Firestore query plan.

### Endpoints

| Method | Path |
|--------|------|
| GET | `/api/chat/analytics/overview` |
| GET | `/api/chat/analytics/sites` |
| GET | `/api/chat/analytics/campaigns` |
| GET | `/api/chat/analytics/agents` |

Query params: `range` (`today`, `7d`, `30d`, `custom`), `from`, `to`, optional `orgSlug`.

### Deploy indexes

```bash
cd backend/integrations/firebase
firebase deploy --only firestore:indexes --project ongo-dev-d5735
```

### Verify

```bash
curl -s -H "Authorization: Bearer $SMS_APP_API_KEY" \
  "https://communications.ongocare.com/api/chat/analytics/overview?range=7d&orgSlug=ongo" | jq
```
