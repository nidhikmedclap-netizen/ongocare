# Communications Hub — Phase 2 Hardening Deployment

Deploy Firestore indexes, security rules, and the updated communications-service together.

## Prerequisites

- Firebase CLI logged in with access to `ongo-dev-d5735`
- Service account for communications-service unchanged
- Branch: `feature/communications-hub`

## Migration steps

### 1. Deploy Firestore composite indexes

Indexes are defined in `backend/integrations/firebase/firestore.indexes.json`.

```bash
cd backend/integrations/firebase
firebase deploy --only firestore:indexes --project ongo-dev-d5735
```

Replace project ID with your target (`ongo-dev-d5735`).

Index builds run asynchronously. Monitor in Firebase Console → Firestore → Indexes until all show **Enabled** (typically 5–30 minutes).

### 2. Deploy Firestore security rules

```bash
cd backend/integrations/firebase
firebase deploy --only firestore:rules --project ongo-dev-d5735
```

Rules added for root hub collections:

| Collection | Client read | Client write |
|------------|-------------|--------------|
| `contacts` | Authenticated | Denied |
| `conversations` | Authenticated | Denied |
| `communications` | Authenticated | Denied |
| `calls` | Authenticated | Denied |

Admin SDK (communications-service) bypasses rules.

### 3. Deploy communications-service

```bash
cd /opt/ongocare/communications-service
git pull origin feature/communications-hub

cd backend/communications-service
npm install

env -u GOOGLE_APPLICATION_CREDENTIALS -u FIREBASE_PROJECT_ID -u VOICE_TOKEN_PORT \
  pm2 delete ongocare-communications 2>/dev/null || true

env -u GOOGLE_APPLICATION_CREDENTIALS -u FIREBASE_PROJECT_ID -u VOICE_TOKEN_PORT \
  pm2 start server.js --name ongocare-communications \
  --cwd /opt/ongocare/communications-service/backend/communications-service
```

Verify:

```bash
curl -s http://127.0.0.1:3102/health | jq
```

### 4. Smoke test

Place one completed SDK outbound call. Confirm in Firestore:

- `calls/{CallSid}` has `contactId`, `conversationId`, `communicationId`
- New contacts use deterministic doc ID = normalized E.164 (e.g. `+919876265679`)
- Legacy auto-ID contacts (e.g. `IiXhJcLNNmC8DSZucT9Q`) continue to resolve via `phonesE164` query

## Rollback steps

### Rollback application code

```bash
cd /opt/ongocare/communications-service
git checkout 9bcb1c0   # last commit before hardening
cd backend/communications-service
env -u GOOGLE_APPLICATION_CREDENTIALS -u FIREBASE_PROJECT_ID -u VOICE_TOKEN_PORT \
  pm2 restart ongocare-communications
```

Or checkout `7ab7563` for Phase 2 without activity tracking.

### Rollback Firestore rules

```bash
cd backend/integrations/firebase
git checkout 9bcb1c0 -- firestore.rules
firebase deploy --only firestore:rules --project ongo-dev-d5735
```

### Rollback indexes

Firestore does not support deleting composite indexes via CLI easily. Unused indexes are harmless. To remove manually: Firebase Console → Firestore → Indexes → delete hub indexes.

## Contact ID strategy

**New contacts:** deterministic document ID = normalized primary E.164 (`buildContactKey`).

**Existing contacts:** legacy auto-generated IDs remain valid. Transaction reads deterministic doc first, then falls back to `phonesE164` array-contains query.

**Duplicate prevention:** concurrent webhooks for the same number contend on the same deterministic doc ID inside a Firestore transaction; only one create succeeds.

No historical contact documents are migrated or modified unless they receive a new completed call.

## Atomic linking

Completed call linking uses a single Firestore transaction (`lib/callLinkTransaction.js`) writing:

1. `contacts/{id}`
2. `conversations/{peer}_{line}`
3. `communications/call_{CallSid}` (skip if already exists)
4. `calls/{CallSid}`

All succeed or none are committed.
