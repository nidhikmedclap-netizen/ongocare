const { FieldPath } = require("firebase-admin/firestore");
const { getFirestore } = require("../lib/firebase");
const { normalizeE164 } = require("../lib/phoneE164");
const { normalizeOrgSlug } = require("../lib/orgSlug");
const {
  encodeCursor,
  decodeCursor,
  isoToTimestamp,
} = require("../lib/inboxCursor");
const {
  mapConversationListItem,
  mapConversationDetail,
  mapContactSummary,
  mapTimelineItem,
} = require("../lib/inboxMapper");

class InboxService {
  constructor(deps = {}) {
    this.db = deps.db || null;
  }

  firestore() {
    return this.db || getFirestore();
  }

  async fetchContactsByIds(contactIds) {
    const uniqueIds = [...new Set(contactIds.filter(Boolean))];
    if (!uniqueIds.length) return new Map();

    const db = this.firestore();
    const refs = uniqueIds.map((id) => db.collection("contacts").doc(id));
    const snaps = await db.getAll(...refs);
    const map = new Map();
    for (const snap of snaps) {
      if (snap.exists) {
        map.set(snap.id, { id: snap.id, ...snap.data() });
      }
    }
    return map;
  }

  applyOrgSlugFilter(query, allowedOrgSlugs) {
    if (!Array.isArray(allowedOrgSlugs) || !allowedOrgSlugs.length) {
      return query;
    }

    if (allowedOrgSlugs.length === 1) {
      return query.where("orgSlug", "==", allowedOrgSlugs[0]);
    }

    return query.where("orgSlug", "in", allowedOrgSlugs);
  }

  matchesOrgFilter(row, allowedOrgSlugs) {
    if (!Array.isArray(allowedOrgSlugs) || !allowedOrgSlugs.length) return true;
    const orgSlug = normalizeOrgSlug(row.orgSlug);
    return orgSlug && allowedOrgSlugs.includes(orgSlug);
  }

  buildConversationListQuery(db, { orgFilter, normalizedLine, decoded }) {
    let query = db.collection("conversations");

    if (orgFilter) {
      query = this.applyOrgSlugFilter(query, orgFilter);
    } else if (normalizedLine) {
      query = query.where("businessLineE164", "==", normalizedLine);
    }

    query = query
      .orderBy("lastMessageAt", "desc")
      .orderBy(FieldPath.documentId(), "desc");

    if (decoded) {
      query = query.startAfter(
        isoToTimestamp(decoded.lastMessageAt),
        decoded.conversationId,
      );
    }

    return query;
  }

  async fetchConversationListDocs(db, { orgFilter, normalizedLine, decoded, limit }) {
    const indexedQuery = this.buildConversationListQuery(db, {
      orgFilter,
      normalizedLine: orgFilter ? null : normalizedLine,
      decoded,
    });

    try {
      const snap = await indexedQuery.limit(limit + 1).get();
      let docs = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      if (orgFilter && normalizedLine) {
        docs = docs.filter((row) => normalizeE164(row.businessLineE164) === normalizedLine);
      }
      return docs;
    } catch (error) {
      if (error.code !== 9 || !orgFilter) {
        throw error;
      }

      console.warn(
        "[inbox] orgSlug Firestore index missing; using in-memory org filter. Deploy backend/integrations/firebase/firestore.indexes.json.",
      );

      const fallbackQuery = this.buildConversationListQuery(db, {
        orgFilter: null,
        normalizedLine,
        decoded,
      });
      const snap = await fallbackQuery.limit(Math.max((limit + 1) * 5, 100)).get();
      let docs = snap.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((row) => this.matchesOrgFilter(row, orgFilter));

      if (normalizedLine) {
        docs = docs.filter((row) => normalizeE164(row.businessLineE164) === normalizedLine);
      }

      return docs.slice(0, limit + 1);
    }
  }

  async listConversations({
    limit = 25,
    cursor = null,
    businessLineE164 = null,
    allowedOrgSlugs = null,
  }) {
    const db = this.firestore();

    const orgFilter = Array.isArray(allowedOrgSlugs) && allowedOrgSlugs.length
      ? allowedOrgSlugs
      : null;
    const normalizedLine = businessLineE164 ? normalizeE164(businessLineE164) : null;

    const decoded = decodeCursor(cursor, "cursor");
    if (decoded) {
      if (!decoded.lastMessageAt || !decoded.conversationId) {
        const error = new Error("invalid_cursor");
        error.status = 400;
        throw error;
      }
    }

    let docs = await this.fetchConversationListDocs(db, {
      orgFilter,
      normalizedLine,
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
        lastMessageAt: mapConversationListItem(last, null).lastActivityAt,
        conversationId: last.id,
      });
    }

    return {
      conversations,
      pagination: {
        limit,
        nextCursor,
        hasMore,
      },
    };
  }

  async getConversationDetail({ conversationId, limit = 50, cursor = null }) {
    const db = this.firestore();
    const conversationSnap = await db.collection("conversations").doc(conversationId).get();
    if (!conversationSnap.exists) {
      const error = new Error("conversation_not_found");
      error.status = 404;
      throw error;
    }

    const conversation = { id: conversationSnap.id, ...conversationSnap.data() };
    const contact = conversation.contactId
      ? await db.collection("contacts").doc(conversation.contactId).get()
      : null;
    const contactData =
      contact && contact.exists ? { id: contact.id, ...contact.data() } : null;

    const decoded = decodeCursor(cursor, "cursor");
    if (decoded && !decoded.occurredAt) {
      const error = new Error("invalid_cursor");
      error.status = 400;
      throw error;
    }

    const timelineSnap = await db
      .collection("communications")
      .where("conversationId", "==", conversationId)
      .get();

    const sortedTimelineDocs = timelineSnap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((left, right) => {
        const leftAt = left.occurredAt?.toMillis?.() ?? 0;
        const rightAt = right.occurredAt?.toMillis?.() ?? 0;
        if (rightAt !== leftAt) return rightAt - leftAt;
        return right.id.localeCompare(left.id);
      });

    let startIndex = 0;
    if (decoded?.occurredAt) {
      const cursorMs = new Date(decoded.occurredAt).getTime();
      if (Number.isNaN(cursorMs)) {
        const error = new Error("invalid_cursor");
        error.status = 400;
        throw error;
      }
      const cursorIndex = sortedTimelineDocs.findIndex((item) => {
        const itemMs = item.occurredAt?.toMillis?.() ?? 0;
        return itemMs < cursorMs;
      });
      startIndex = cursorIndex === -1 ? sortedTimelineDocs.length : cursorIndex;
    }

    const pageSlice = sortedTimelineDocs.slice(startIndex, startIndex + limit + 1);
    const hasMore = pageSlice.length > limit;
    const page = hasMore ? pageSlice.slice(0, limit) : pageSlice;
    const timeline = page.map(mapTimelineItem);

    let nextCursor = null;
    if (hasMore && page.length) {
      const last = page[page.length - 1];
      nextCursor = encodeCursor({
        occurredAt: mapTimelineItem(last).occurredAt,
      });
    }

    return {
      conversation: mapConversationDetail(conversation),
      contact: mapContactSummary(contactData),
      timeline,
      pagination: {
        limit,
        nextCursor,
        hasMore,
      },
    };
  }
}

module.exports = InboxService;
