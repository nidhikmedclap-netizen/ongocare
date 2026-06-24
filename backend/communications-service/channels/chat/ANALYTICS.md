# Phase 5.3 — Chat Analytics & Lead Attribution

Read-only analytics APIs over existing Firestore collections. No duplicate analytics store.

## Auth

All endpoints require `checkAppAuth` + `resolveOrgAccess`.

| Principal | Scope |
|-----------|-------|
| Superadmin | All orgs (aggregated across orgs when `orgSlug` omitted) |
| Scoped user | `allowedOrgSlugs` only |
| Legacy service key | `COMMUNICATIONS_DEFAULT_ORG_SLUG` org |

Optional query param `orgSlug` narrows to one org (must be in scope).

## Time filters

| Param | Values |
|-------|--------|
| `range` or `preset` | `today`, `7d` (default), `30d`, `custom` |
| `from` | ISO timestamp (required when `range=custom`) |
| `to` | ISO timestamp (optional for custom; defaults to now) |

All ranges are evaluated in UTC.

## Endpoints

### `GET /api/chat/analytics/overview`

Per-org chat funnel counts for the selected window.

**Response**

```json
{
  "ok": true,
  "range": { "preset": "7d", "from": "...", "to": "..." },
  "orgs": [
    {
      "orgSlug": "weightloss",
      "visitors": 42,
      "sessions": 55,
      "conversations": 38,
      "messages": 210,
      "assignedConversations": 20,
      "unassignedConversations": 18,
      "openConversations": 25,
      "closedConversations": 13
    }
  ],
  "totals": {
    "visitors": 42,
    "sessions": 55,
    "conversations": 38,
    "messages": 210,
    "assignedConversations": 20,
    "unassignedConversations": 18,
    "openConversations": 25,
    "closedConversations": 13
  }
}
```

Answers: *How is chat performing per org?*

---

### `GET /api/chat/analytics/sites`

Attribution grouped by `siteKey` (from `chatVisitors`, `chatSessions`, `conversations`).

**Response**

```json
{
  "ok": true,
  "range": { "preset": "7d", "from": "...", "to": "..." },
  "groups": [
    {
      "orgSlug": "weightloss",
      "siteKey": "weightloss-main",
      "visitors": 10,
      "sessions": 12,
      "conversations": 8,
      "messages": 45,
      "leads": 3
    }
  ]
}
```

Answers: *Which website generated this lead?*

---

### `GET /api/chat/analytics/campaigns`

Attribution grouped by:

- `siteKey`
- `pageUrl` (origin + path, normalized)
- `referrer` (hostname)
- `utm.source`, `utm.medium`, `utm.campaign`

Sourced from `chatSessions.context` and `chatVisitors.firstContext` / `lastContext`.

**Response**

```json
{
  "ok": true,
  "range": { "preset": "7d", "from": "...", "to": "..." },
  "groups": [
    {
      "orgSlug": "weightloss",
      "siteKey": "weightloss-main",
      "pageUrl": "https://weightloss.com/pricing",
      "referrer": "google.com",
      "utm": {
        "source": "google",
        "medium": "cpc",
        "campaign": "spring-sale"
      },
      "visitors": 4,
      "sessions": 5,
      "conversations": 4,
      "messages": 20,
      "leads": 1
    }
  ]
}
```

Answers: *Which campaign generated this chat?*

---

### `GET /api/chat/analytics/agents`

Per-agent performance for the window.

**Response**

```json
{
  "ok": true,
  "range": { "preset": "7d", "from": "...", "to": "..." },
  "agents": [
    {
      "orgSlug": "weightloss",
      "uid": "firebase-uid",
      "displayName": "Jane Agent",
      "assignedChats": 15,
      "repliedChats": 12,
      "activeChats": 3,
      "averageFirstResponseTimeMs": 125000,
      "averageFirstResponseTimeSeconds": 125,
      "firstResponseSampleCount": 9
    }
  ]
}
```

| Metric | Source |
|--------|--------|
| `assignedChats` | Distinct chat conversations with `assignedTo` in range |
| `repliedChats` | Distinct conversations with agent `communications` in range |
| `activeChats` | Assigned chat conversations with `status != closed` in range |
| `averageFirstResponseTimeMs` | Per session: first visitor text → first agent text |

Answers: *Which agent handled it?*

## Firestore query plan

All aggregation is computed in the service from live documents (no rollup collections).

| Metric | Collection | Primary query | Time field |
|--------|------------|---------------|------------|
| Visitors | `chatVisitors` | `orgSlug ==` + `firstSeenAt` range | `firstSeenAt` |
| Sessions | `chatSessions` | `orgSlug ==` + `startedAt` range | `startedAt` |
| Conversations | `conversations` | `orgSlug ==`, `channel == chat`, `lastMessageAt` range | `lastMessageAt` |
| Messages | `communications` | `orgSlug ==`, `type == chat`, `occurredAt` range | `occurredAt` |
| Attribution | `chatSessions` / `chatVisitors` | Same session/visitor loads | `context.*`, `firstContext.*` |
| Agent replies | `communications` | `sender.kind == agent` (in-memory on chat messages) | `occurredAt` |
| Assignment | `conversations` | `assignedTo`, `assignedAt` / `lastMessageAt` | in range |

Superadmin queries omit `orgSlug` equality and group results in memory by `orgSlug`.

When a composite index is missing, the service logs a warning and falls back to a broader query plus in-memory date filtering (same pattern as queue views).

## Index requirements

Added in `backend/integrations/firebase/firestore.indexes.json`:

| Collection | Fields |
|------------|--------|
| `chatVisitors` | `orgSlug` ASC, `firstSeenAt` ASC |
| `chatVisitors` | `firstSeenAt` ASC |
| `chatSessions` | `orgSlug` ASC, `startedAt` ASC |
| `chatSessions` | `startedAt` ASC |
| `conversations` | `orgSlug` ASC, `channel` ASC, `lastMessageAt` ASC |
| `conversations` | `channel` ASC, `lastMessageAt` ASC |
| `communications` | `orgSlug` ASC, `type` ASC, `occurredAt` ASC |
| `communications` | `type` ASC, `occurredAt` ASC |

Deploy:

```bash
cd backend/integrations/firebase
firebase deploy --only firestore:indexes --project ongo-dev-d5735
```

## Deployment

```bash
cd /opt/ongocare/communications-service
git pull origin development
pm2 restart ongocare-communications --cwd backend/communications-service
```

Verify:

```bash
curl -s -H "Authorization: Bearer $SMS_APP_API_KEY" \
  "https://communications.ongocare.com/api/chat/analytics/overview?range=7d&orgSlug=weightloss" | jq
```

## Example questions

| Question | Endpoint |
|----------|----------|
| Which website generated this lead? | `/analytics/sites` or `/analytics/campaigns` |
| Which campaign generated this chat? | `/analytics/campaigns` |
| Which agent handled it? | `/analytics/agents` + conversation `assignedTo` |
