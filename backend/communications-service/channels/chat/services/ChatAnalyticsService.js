const { getFirestore } = require("../../../lib/firebase");
const { normalizeOrgSlug } = require("../../../lib/orgSlug");
const { parseAnalyticsRange, isWithinRange, timestampMillis } = require("../lib/chatAnalyticsRange");
const { resolveAnalyticsOrgSlugs } = require("../lib/chatAnalyticsScope");
const {
  attributionFromSession,
  attributionFromVisitor,
  buildAttributionKey,
  createAttributionBucket,
  finalizeAttributionBucket,
  createSiteBucket,
  finalizeSiteBucket,
} = require("../lib/chatAnalyticsAttribution");

function emptyOverview(orgSlug) {
  return {
    orgSlug,
    visitors: 0,
    sessions: 0,
    conversations: 0,
    messages: 0,
    assignedConversations: 0,
    unassignedConversations: 0,
    openConversations: 0,
    closedConversations: 0,
  };
}

function sumOverview(rows) {
  return rows.reduce(
    (totals, row) => ({
      visitors: totals.visitors + row.visitors,
      sessions: totals.sessions + row.sessions,
      conversations: totals.conversations + row.conversations,
      messages: totals.messages + row.messages,
      assignedConversations: totals.assignedConversations + row.assignedConversations,
      unassignedConversations: totals.unassignedConversations + row.unassignedConversations,
      openConversations: totals.openConversations + row.openConversations,
      closedConversations: totals.closedConversations + row.closedConversations,
    }),
    emptyOverview(null),
  );
}

function isLeadQualified(entity) {
  const status = String(entity?.lead?.status || "").toLowerCase();
  return status === "qualified";
}

class ChatAnalyticsService {
  constructor(deps = {}) {
    this.db = deps.db || null;
    this.userDisplayNames = deps.userDisplayNames || new Map();
  }

  firestore() {
    return this.db || getFirestore();
  }

  async runQuery(label, primaryQuery, fallbackQuery) {
    try {
      const snap = await primaryQuery.get();
      return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      if (error.code !== 9) {
        throw error;
      }
      console.warn(
        `[chat/analytics] ${label} index missing; using broader fallback query. Deploy firestore.indexes.json.`,
      );
      const snap = await fallbackQuery.get();
      return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    }
  }

  orgMatches(rowOrgSlug, orgSlugs) {
    const slug = normalizeOrgSlug(rowOrgSlug);
    if (!slug) return false;
    if (!orgSlugs) return true;
    return orgSlugs.includes(slug);
  }

  async loadVisitors({ orgSlugs, range }) {
    const db = this.firestore();
    const rows = [];

    if (orgSlugs?.length) {
      for (const orgSlug of orgSlugs) {
        const primary = db
          .collection("chatVisitors")
          .where("orgSlug", "==", orgSlug)
          .where("firstSeenAt", ">=", range.fromTimestamp)
          .where("firstSeenAt", "<=", range.toTimestamp);
        const fallback = db.collection("chatVisitors").where("orgSlug", "==", orgSlug);
        const docs = await this.runQuery("chatVisitors", primary, fallback);
        rows.push(
          ...docs.filter((row) => isWithinRange(row.firstSeenAt || row.lastSeenAt, range)),
        );
      }
      return rows;
    }

    const primary = db
      .collection("chatVisitors")
      .where("firstSeenAt", ">=", range.fromTimestamp)
      .where("firstSeenAt", "<=", range.toTimestamp);
    const fallback = db.collection("chatVisitors");
    const docs = await this.runQuery("chatVisitors", primary, fallback);
    return docs.filter((row) => isWithinRange(row.firstSeenAt || row.lastSeenAt, range));
  }

  async loadSessions({ orgSlugs, range }) {
    const db = this.firestore();
    const rows = [];

    if (orgSlugs?.length) {
      for (const orgSlug of orgSlugs) {
        const primary = db
          .collection("chatSessions")
          .where("orgSlug", "==", orgSlug)
          .where("startedAt", ">=", range.fromTimestamp)
          .where("startedAt", "<=", range.toTimestamp);
        const fallback = db.collection("chatSessions").where("orgSlug", "==", orgSlug);
        const docs = await this.runQuery("chatSessions", primary, fallback);
        rows.push(...docs.filter((row) => isWithinRange(row.startedAt, range)));
      }
      return rows;
    }

    const primary = db
      .collection("chatSessions")
      .where("startedAt", ">=", range.fromTimestamp)
      .where("startedAt", "<=", range.toTimestamp);
    const fallback = db.collection("chatSessions");
    const docs = await this.runQuery("chatSessions", primary, fallback);
    return docs.filter((row) => isWithinRange(row.startedAt, range));
  }

  async loadChatConversations({ orgSlugs, range }) {
    const db = this.firestore();
    const rows = [];

    if (orgSlugs?.length) {
      for (const orgSlug of orgSlugs) {
        const primary = db
          .collection("conversations")
          .where("orgSlug", "==", orgSlug)
          .where("channel", "==", "chat")
          .where("lastMessageAt", ">=", range.fromTimestamp)
          .where("lastMessageAt", "<=", range.toTimestamp);
        const fallback = db
          .collection("conversations")
          .where("orgSlug", "==", orgSlug)
          .where("channel", "==", "chat");
        const docs = await this.runQuery("conversations.chat", primary, fallback);
        rows.push(
          ...docs.filter((row) =>
            isWithinRange(row.lastMessageAt || row.createdAt, range),
          ),
        );
      }
      return rows;
    }

    const primary = db
      .collection("conversations")
      .where("channel", "==", "chat")
      .where("lastMessageAt", ">=", range.fromTimestamp)
      .where("lastMessageAt", "<=", range.toTimestamp);
    const fallback = db.collection("conversations").where("channel", "==", "chat");
    const docs = await this.runQuery("conversations.chat", primary, fallback);
    return docs.filter((row) => isWithinRange(row.lastMessageAt || row.createdAt, range));
  }

  async loadChatMessages({ orgSlugs, range }) {
    const db = this.firestore();
    const rows = [];

    if (orgSlugs?.length) {
      for (const orgSlug of orgSlugs) {
        const primary = db
          .collection("communications")
          .where("orgSlug", "==", orgSlug)
          .where("type", "==", "chat")
          .where("occurredAt", ">=", range.fromTimestamp)
          .where("occurredAt", "<=", range.toTimestamp);
        const fallback = db.collection("communications").where("orgSlug", "==", orgSlug);
        const docs = await this.runQuery("communications.chat", primary, fallback);
        rows.push(
          ...docs.filter(
            (row) => row.type === "chat" && isWithinRange(row.occurredAt, range),
          ),
        );
      }
      return rows;
    }

    const primary = db
      .collection("communications")
      .where("type", "==", "chat")
      .where("occurredAt", ">=", range.fromTimestamp)
      .where("occurredAt", "<=", range.toTimestamp);
    const fallback = db.collection("communications");
    const docs = await this.runQuery("communications.chat", primary, fallback);
    return docs.filter((row) => row.type === "chat" && isWithinRange(row.occurredAt, range));
  }

  buildOverviewByOrg({ visitors, sessions, conversations, messages }) {
    const byOrg = new Map();

    const ensure = (orgSlug) => {
      const slug = normalizeOrgSlug(orgSlug);
      if (!slug) return null;
      if (!byOrg.has(slug)) {
        byOrg.set(slug, emptyOverview(slug));
      }
      return byOrg.get(slug);
    };

    for (const row of visitors) {
      const bucket = ensure(row.orgSlug);
      if (bucket) bucket.visitors += 1;
    }

    for (const row of sessions) {
      const bucket = ensure(row.orgSlug);
      if (bucket) bucket.sessions += 1;
    }

    for (const row of conversations) {
      const bucket = ensure(row.orgSlug);
      if (!bucket) continue;
      bucket.conversations += 1;
      if (row.assignedTo) {
        bucket.assignedConversations += 1;
      } else {
        bucket.unassignedConversations += 1;
      }
      if (String(row.status || "").toLowerCase() === "closed") {
        bucket.closedConversations += 1;
      } else {
        bucket.openConversations += 1;
      }
    }

    for (const row of messages) {
      const bucket = ensure(row.orgSlug);
      if (bucket) bucket.messages += 1;
    }

    return [...byOrg.values()].sort((left, right) => left.orgSlug.localeCompare(right.orgSlug));
  }

  async getOverview({ req, query = {} }) {
    const range = parseAnalyticsRange(query);
    const { orgSlugs } = resolveAnalyticsOrgSlugs(req, query.orgSlug);

    const [visitors, sessions, conversations, messages] = await Promise.all([
      this.loadVisitors({ orgSlugs, range }),
      this.loadSessions({ orgSlugs, range }),
      this.loadChatConversations({ orgSlugs, range }),
      this.loadChatMessages({ orgSlugs, range }),
    ]);

    const orgs = this.buildOverviewByOrg({ visitors, sessions, conversations, messages });

    return {
      range: {
        preset: range.preset,
        from: range.fromIso,
        to: range.toIso,
      },
      orgs,
      totals: sumOverview(orgs),
    };
  }

  async getSiteAttribution({ req, query = {} }) {
    const range = parseAnalyticsRange(query);
    const { orgSlugs } = resolveAnalyticsOrgSlugs(req, query.orgSlug);

    const [visitors, sessions, conversations, messages] = await Promise.all([
      this.loadVisitors({ orgSlugs, range }),
      this.loadSessions({ orgSlugs, range }),
      this.loadChatConversations({ orgSlugs, range }),
      this.loadChatMessages({ orgSlugs, range }),
    ]);

    const buckets = new Map();
    const ensureSite = (orgSlug, siteKey) => {
      const key = `${orgSlug}::${siteKey || "unknown"}`;
      if (!buckets.has(key)) {
        buckets.set(key, createSiteBucket(siteKey || null, orgSlug));
      }
      return buckets.get(key);
    };

    for (const visitor of visitors) {
      const bucket = ensureSite(visitor.orgSlug, visitor.siteKey);
      bucket.visitorIds.add(visitor.visitorId);
      if (isLeadQualified(visitor)) bucket.leads += 1;
    }

    for (const session of sessions) {
      const bucket = ensureSite(session.orgSlug, session.siteKey);
      bucket.sessionIds.add(session.sessionId);
      if (session.conversationId) {
        bucket.conversationIds.add(session.conversationId);
      }
    }

    for (const conversation of conversations) {
      const bucket = ensureSite(conversation.orgSlug, conversation.siteKey);
      bucket.conversationIds.add(conversation.id);
      if (isLeadQualified(conversation)) bucket.leads += 1;
    }

    const conversationSiteById = new Map(
      conversations.map((row) => [row.id, row.siteKey || null]),
    );

    for (const message of messages) {
      const siteKey =
        message.siteKey || conversationSiteById.get(message.conversationId) || null;
      const bucket = ensureSite(message.orgSlug, siteKey);
      bucket.messages += 1;
    }

    const groups = [...buckets.values()]
      .map(finalizeSiteBucket)
      .sort((left, right) => {
        if (left.orgSlug !== right.orgSlug) {
          return left.orgSlug.localeCompare(right.orgSlug);
        }
        return String(left.siteKey || "").localeCompare(String(right.siteKey || ""));
      });

    return {
      range: {
        preset: range.preset,
        from: range.fromIso,
        to: range.toIso,
      },
      groups,
    };
  }

  async getCampaignAttribution({ req, query = {} }) {
    const range = parseAnalyticsRange(query);
    const { orgSlugs } = resolveAnalyticsOrgSlugs(req, query.orgSlug);

    const [visitors, sessions, conversations, messages] = await Promise.all([
      this.loadVisitors({ orgSlugs, range }),
      this.loadSessions({ orgSlugs, range }),
      this.loadChatConversations({ orgSlugs, range }),
      this.loadChatMessages({ orgSlugs, range }),
    ]);

    const buckets = new Map();
    const ensureBucket = (orgSlug, attribution) => {
      const key = `${orgSlug}::${buildAttributionKey(attribution)}`;
      if (!buckets.has(key)) {
        buckets.set(key, createAttributionBucket(attribution, orgSlug));
      }
      return buckets.get(key);
    };

    for (const visitor of visitors) {
      const bucket = ensureBucket(visitor.orgSlug, attributionFromVisitor(visitor));
      bucket.visitorIds.add(visitor.visitorId);
      if (isLeadQualified(visitor)) bucket.leads += 1;
    }

    for (const session of sessions) {
      const bucket = ensureBucket(session.orgSlug, attributionFromSession(session));
      bucket.sessionIds.add(session.sessionId);
      if (session.conversationId) {
        bucket.conversationIds.add(session.conversationId);
      }
    }

    for (const conversation of conversations) {
      const matchingSession = sessions.find(
        (row) => row.conversationId === conversation.id,
      );
      const attribution = matchingSession
        ? attributionFromSession(matchingSession)
        : {
            siteKey: conversation.siteKey || null,
            pageUrl: null,
            referrer: null,
            utm: { source: null, medium: null, campaign: null },
          };
      const bucket = ensureBucket(conversation.orgSlug, attribution);
      bucket.conversationIds.add(conversation.id);
      if (isLeadQualified(conversation)) bucket.leads += 1;
    }

    const sessionById = new Map(sessions.map((row) => [row.sessionId, row]));

    for (const message of messages) {
      const session = message.sessionId ? sessionById.get(message.sessionId) : null;
      const attribution = session
        ? attributionFromSession(session)
        : {
            siteKey: message.siteKey || null,
            pageUrl: null,
            referrer: null,
            utm: { source: null, medium: null, campaign: null },
          };
      const bucket = ensureBucket(message.orgSlug, attribution);
      bucket.messages += 1;
    }

    const groups = [...buckets.values()]
      .map(finalizeAttributionBucket)
      .sort((left, right) => right.sessions - left.sessions);

    return {
      range: {
        preset: range.preset,
        from: range.fromIso,
        to: range.toIso,
      },
      groups,
    };
  }

  async loadAgentDisplayName(uid) {
    if (!uid) return null;
    if (this.userDisplayNames.has(uid)) {
      return this.userDisplayNames.get(uid);
    }

    const snap = await this.firestore().collection("users").doc(uid).get();
    if (!snap.exists) {
      this.userDisplayNames.set(uid, null);
      return null;
    }

    const data = snap.data() || {};
    const parts = [data.firstName, data.lastName].filter(Boolean).join(" ").trim();
    const displayName = data.displayName || data.name || parts || data.email || null;
    this.userDisplayNames.set(uid, displayName);
    return displayName;
  }

  computeFirstResponseTimes(messages, sessions) {
    const bySession = new Map();

    for (const message of messages) {
      if (!message.sessionId) continue;
      if (!bySession.has(message.sessionId)) {
        bySession.set(message.sessionId, []);
      }
      bySession.get(message.sessionId).push(message);
    }

    const sessionOrgById = new Map(
      sessions.map((row) => [row.sessionId, row.orgSlug]),
    );

    const deltasByAgentOrg = new Map();

    for (const [sessionId, sessionMessages] of bySession.entries()) {
      const sorted = sessionMessages
        .slice()
        .sort(
          (left, right) =>
            (timestampMillis(left.occurredAt) || 0) - (timestampMillis(right.occurredAt) || 0),
        );

      const firstVisitor = sorted.find(
        (row) =>
          row.contentType === "text" &&
          (row.sender?.kind === "visitor" || row.direction === "inbound"),
      );
      if (!firstVisitor) continue;

      const visitorAt = timestampMillis(firstVisitor.occurredAt);
      if (visitorAt == null) continue;

      const firstAgent = sorted.find((row) => {
        const agentAt = timestampMillis(row.occurredAt);
        if (agentAt == null || agentAt < visitorAt) return false;
        if (row.sender?.kind === "agent") return true;
        return row.direction === "outbound" && row.sender?.kind !== "visitor";
      });
      if (!firstAgent?.sender?.uid) continue;

      const uid = firstAgent.sender.uid;
      const orgSlug = sessionOrgById.get(sessionId) || firstAgent.orgSlug;
      const key = `${orgSlug}::${uid}`;
      if (!deltasByAgentOrg.has(key)) {
        deltasByAgentOrg.set(key, []);
      }
      deltasByAgentOrg.get(key).push(timestampMillis(firstAgent.occurredAt) - visitorAt);
    }

    return deltasByAgentOrg;
  }

  async getAgentMetrics({ req, query = {} }) {
    const range = parseAnalyticsRange(query);
    const { orgSlugs } = resolveAnalyticsOrgSlugs(req, query.orgSlug);

    const [sessions, conversations, messages] = await Promise.all([
      this.loadSessions({ orgSlugs, range }),
      this.loadChatConversations({ orgSlugs, range }),
      this.loadChatMessages({ orgSlugs, range }),
    ]);

    const agentBuckets = new Map();
    const ensureAgent = (orgSlug, uid) => {
      const key = `${orgSlug}::${uid}`;
      if (!agentBuckets.has(key)) {
        agentBuckets.set(key, {
          orgSlug,
          uid,
          displayName: null,
          assignedChats: 0,
          repliedChats: 0,
          activeChats: 0,
          firstResponseSamples: [],
          assignedConversationIds: new Set(),
          repliedConversationIds: new Set(),
        });
      }
      return agentBuckets.get(key);
    };

    for (const conversation of conversations) {
      if (!conversation.assignedTo) continue;
      const assignedAt = conversation.assignedAt;
      const inRange =
        isWithinRange(assignedAt, range) ||
        isWithinRange(conversation.lastMessageAt || conversation.createdAt, range);
      if (!inRange) continue;

      const bucket = ensureAgent(conversation.orgSlug, conversation.assignedTo);
      bucket.assignedConversationIds.add(conversation.id);
      if (String(conversation.status || "").toLowerCase() !== "closed") {
        bucket.activeChats += 1;
      }
    }

    for (const message of messages) {
      const uid = message.sender?.uid;
      if (message.sender?.kind !== "agent" || !uid) continue;
      const bucket = ensureAgent(message.orgSlug, uid);
      if (message.conversationId) {
        bucket.repliedConversationIds.add(message.conversationId);
      }
    }

    const responseTimes = this.computeFirstResponseTimes(messages, sessions);
    for (const [key, samples] of responseTimes.entries()) {
      if (!agentBuckets.has(key)) {
        const [orgSlug, uid] = key.split("::");
        ensureAgent(orgSlug, uid).firstResponseSamples = samples;
      } else {
        agentBuckets.get(key).firstResponseSamples = samples;
      }
    }

    const agents = [];
    for (const bucket of agentBuckets.values()) {
      bucket.assignedChats = bucket.assignedConversationIds.size;
      bucket.repliedChats = bucket.repliedConversationIds.size;
      const samples = bucket.firstResponseSamples || [];
      const averageFirstResponseTimeMs = samples.length
        ? Math.round(samples.reduce((sum, value) => sum + value, 0) / samples.length)
        : null;

      agents.push({
        orgSlug: bucket.orgSlug,
        uid: bucket.uid,
        displayName: await this.loadAgentDisplayName(bucket.uid),
        assignedChats: bucket.assignedChats,
        repliedChats: bucket.repliedChats,
        activeChats: bucket.activeChats,
        averageFirstResponseTimeMs,
        averageFirstResponseTimeSeconds:
          averageFirstResponseTimeMs == null
            ? null
            : Math.round(averageFirstResponseTimeMs / 1000),
        firstResponseSampleCount: samples.length,
      });
    }

    agents.sort((left, right) => {
      if (left.orgSlug !== right.orgSlug) {
        return left.orgSlug.localeCompare(right.orgSlug);
      }
      return right.repliedChats - left.repliedChats;
    });

    return {
      range: {
        preset: range.preset,
        from: range.fromIso,
        to: range.toIso,
      },
      agents,
    };
  }
}

module.exports = ChatAnalyticsService;
