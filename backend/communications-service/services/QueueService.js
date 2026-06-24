const { FieldPath } = require("firebase-admin/firestore");
const { getQueueDefinition } = require("../lib/queueDefinitions");
const InboxService = require("./InboxService");
const { encodeCursor, decodeCursor } = require("../lib/inboxCursor");
const { mapConversationListItem } = require("../lib/inboxMapper");

class QueueService extends InboxService {
  resolveQueryValue(spec, { agentUid }) {
    if (spec.valueFrom === "agentUid") {
      return agentUid || null;
    }
    return spec.value;
  }

  buildQueueQuery(db, queueId, { orgFilter, agentUid, decoded }) {
    const definition = getQueueDefinition(queueId);
    const { query: querySpec } = definition;

    let query = db.collection("conversations");

    if (orgFilter?.length === 1) {
      query = query.where("orgSlug", "==", orgFilter[0]);
    } else if (orgFilter?.length > 1) {
      query = query.where("orgSlug", "in", orgFilter);
    }

    for (const equality of querySpec.equality) {
      const value = this.resolveQueryValue(equality, { agentUid });
      if (value == null && equality.valueFrom === "agentUid") {
        return null;
      }
      query = query.where(equality.field, equality.op, value);
    }

    if (querySpec.range) {
      query = query.where(querySpec.range.field, querySpec.range.op, querySpec.range.value);
    }

    for (const order of querySpec.orderBy) {
      query = query.orderBy(order.field, order.direction);
    }
    query = query.orderBy(FieldPath.documentId(), "desc");

    if (decoded?.cursorValues?.length) {
      query = query.startAfter(...decoded.cursorValues);
    }

    return query;
  }

  buildCursorValues(row, queueId) {
    const definition = getQueueDefinition(queueId);
    const values = [];

    for (const order of definition.query.orderBy) {
      values.push(row[order.field] ?? null);
    }
    values.push(row.id);
    return values;
  }

  decodeQueueCursor(cursor, queueId) {
    const decoded = decodeCursor(cursor, "cursor");
    if (!decoded) return null;

    if (!decoded.conversationId || !Array.isArray(decoded.cursorValues)) {
      const error = new Error("invalid_cursor");
      error.status = 400;
      throw error;
    }

    return decoded;
  }

  async fetchQueueDocs(db, { queueId, orgFilter, agentUid, decoded, limit }) {
    const definition = getQueueDefinition(queueId);
    const indexedQuery = this.buildQueueQuery(db, queueId, {
      orgFilter,
      agentUid,
      decoded,
    });

    if (!indexedQuery) {
      return [];
    }

    try {
      const snap = await indexedQuery.limit(limit + 1).get();
      return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      if (error.code !== 9) {
        throw error;
      }

      console.warn(
        `[queues] ${queueId} Firestore index missing; using in-memory filter. Deploy backend/integrations/firebase/firestore.indexes.json.`,
      );

      const fallbackQuery = this.buildConversationListQuery(db, {
        orgFilter: null,
        normalizedLine: null,
        decoded: decoded
          ? {
              lastMessageAt: decoded.cursorValues?.[decoded.cursorValues.length - 2] || null,
              conversationId: decoded.conversationId,
            }
          : null,
      });

      let snap;
      try {
        snap = await fallbackQuery.limit(Math.max((limit + 1) * 5, 100)).get();
      } catch (fallbackError) {
        if (fallbackError.code !== 9) {
          throw fallbackError;
        }
        snap = await db
          .collection("conversations")
          .orderBy("lastMessageAt", "desc")
          .limit(Math.max((limit + 1) * 5, 100))
          .get();
      }
      let docs = snap.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((row) => this.matchesOrgFilter(row, orgFilter))
        .filter((row) => definition.match(row, { agentUid }));

      if (decoded?.conversationId) {
        const cursorIndex = docs.findIndex((row) => row.id === decoded.conversationId);
        if (cursorIndex >= 0) {
          docs = docs.slice(cursorIndex + 1);
        }
      }

      return docs.slice(0, limit + 1);
    }
  }

  async listQueue({
    queueId,
    limit = 25,
    cursor = null,
    allowedOrgSlugs = null,
    agentUid = null,
  }) {
    const definition = getQueueDefinition(queueId);
    const db = this.firestore();

    const orgFilter = Array.isArray(allowedOrgSlugs) && allowedOrgSlugs.length
      ? allowedOrgSlugs
      : null;

    if (definition.requiresAgentUid && !agentUid) {
      return {
        queue: {
          id: definition.id,
          label: definition.label,
          description: definition.description,
        },
        conversations: [],
        pagination: {
          limit,
          nextCursor: null,
          hasMore: false,
        },
      };
    }

    const decoded = this.decodeQueueCursor(cursor, queueId);

    const docs = await this.fetchQueueDocs(db, {
      queueId,
      orgFilter,
      agentUid,
      decoded,
      limit,
    });

    const hasMore = docs.length > limit;
    const page = hasMore ? docs.slice(0, limit) : docs;

    const contacts = await this.fetchContactsByIds(page.map((row) => row.contactId));
    const conversations = page.map((row) =>
      mapConversationListItem(row, contacts.get(row.contactId)),
    );

    let nextCursor = null;
    if (hasMore && page.length) {
      const last = page[page.length - 1];
      nextCursor = encodeCursor({
        conversationId: last.id,
        cursorValues: this.buildCursorValues(last, queueId),
      });
    }

    return {
      queue: {
        id: definition.id,
        label: definition.label,
        description: definition.description,
      },
      conversations,
      pagination: {
        limit,
        nextCursor,
        hasMore,
      },
    };
  }
}

module.exports = QueueService;
