const { getFirestore } = require("../../../lib/firebase");
const ConversationRepository = require("../../../repositories/ConversationRepository");
const ChatSessionRepository = require("../repositories/ChatSessionRepository");
const OrgMembershipRepository = require("../../../repositories/OrgMembershipRepository");
const { applyChatAssignmentInTransaction } = require("../lib/chatAssignmentTransaction");
const { canAssignChat } = require("../lib/chatPermissions");
const { normalizeAssignmentType } = require("../lib/chatEnums");
const {
  getInboxOrgScope,
  isConversationInOrgScope,
} = require("../../../lib/hubInboxAccess");

class ChatAssignmentService {
  constructor(deps = {}) {
    this.conversationRepo = deps.conversationRepo || new ConversationRepository();
    this.sessionRepo = deps.sessionRepo || new ChatSessionRepository();
    this.membershipRepo = deps.membershipRepo || new OrgMembershipRepository();
    this.db = deps.db || null;
  }

  firestore() {
    return this.db || getFirestore();
  }

  async loadMemberships(req) {
    const uid = req.firebaseUser?.uid;
    if (!uid) return [];
    return this.membershipRepo.listActiveByUid(uid);
  }

  async assertCanManageAssignment({ req, conversation }) {
    const scope = getInboxOrgScope(req);
    if (!isConversationInOrgScope({ ...conversation, id: conversation.id }, scope)) {
      const error = new Error("hub_forbidden");
      error.status = 403;
      throw error;
    }

    const memberships = await this.loadMemberships(req);
    if (!canAssignChat({ req, orgSlug: conversation.orgSlug, memberships })) {
      const error = new Error("assignment_forbidden");
      error.status = 403;
      throw error;
    }

    return memberships;
  }

  async resolveAssigneeLabel(assignment) {
    if (assignment.assignedType === "bot") {
      return assignment.assignedTo;
    }

    const snap = await this.firestore().collection("users").doc(assignment.assignedTo).get();
    if (!snap.exists) {
      return assignment.assignedTo;
    }

    const data = snap.data() || {};
    const parts = [data.firstName, data.lastName].filter(Boolean).join(" ").trim();
    return data.displayName || data.name || parts || assignment.assignedTo;
  }

  async getChatConversation(conversationId) {
    const normalizedConversationId = decodeURIComponent(conversationId || "").trim();
    if (!normalizedConversationId) {
      const error = new Error("conversation_id_required");
      error.status = 400;
      throw error;
    }

    const conversation = await this.conversationRepo.getById(normalizedConversationId);
    if (!conversation) {
      const error = new Error("conversation_not_found");
      error.status = 404;
      throw error;
    }

    if (conversation.channel !== "chat" && !conversation.visitorId) {
      const error = new Error("not_chat_conversation");
      error.status = 400;
      throw error;
    }

    const sessionId = conversation.activeSessionId;
    if (!sessionId) {
      const error = new Error("active_session_not_found");
      error.status = 409;
      throw error;
    }

    const session = await this.sessionRepo.getById(sessionId);
    if (!session) {
      const error = new Error("session_not_found");
      error.status = 404;
      throw error;
    }

    if (session.conversationId !== conversation.id) {
      const error = new Error("session_conversation_mismatch");
      error.status = 409;
      throw error;
    }

    return { conversation, session };
  }

  async assignConversation({ conversationId, body, req }) {
    const { conversation, session } = await this.getChatConversation(conversationId);
    await this.assertCanManageAssignment({ req, conversation });

    const assignedTo = String(body.assignedTo || "").trim();
    if (!assignedTo) {
      const error = new Error("assigned_to_required");
      error.status = 400;
      throw error;
    }

    const assignedType = normalizeAssignmentType(body.assignedType, "agent");
    const assignment = { assignedTo, assignedType };
    const assigneeLabel = await this.resolveAssigneeLabel(assignment);
    const assignedBy = req.firebaseUser?.uid || null;

    return applyChatAssignmentInTransaction({
      conversation: { ...conversation, id: conversation.id },
      session,
      action: "assign",
      assignment,
      assigneeLabel,
      assignedBy,
    });
  }

  async unassignConversation({ conversationId, req }) {
    const { conversation, session } = await this.getChatConversation(conversationId);
    await this.assertCanManageAssignment({ req, conversation });

    return applyChatAssignmentInTransaction({
      conversation: { ...conversation, id: conversation.id },
      session,
      action: "unassign",
      assignedBy: req.firebaseUser?.uid || null,
    });
  }
}

module.exports = ChatAssignmentService;
