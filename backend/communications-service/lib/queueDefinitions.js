const QUEUE_IDS = Object.freeze([
  "unassigned",
  "mine",
  "waiting-agent",
  "waiting-visitor",
  "closed",
]);

const QUEUE_DEFINITIONS = Object.freeze({
  unassigned: {
    id: "unassigned",
    label: "Unassigned",
    description: "Conversations with no assigned agent or bot.",
    match: (row) => row.assignedTo == null,
    requiresAgentUid: false,
    query: {
      equality: [{ field: "assignedTo", op: "==", value: null }],
      range: null,
      orderBy: [{ field: "lastMessageAt", direction: "desc" }],
    },
  },
  mine: {
    id: "mine",
    label: "Assigned To Me",
    description: "Conversations assigned to the authenticated agent.",
    match: (row, { agentUid }) => Boolean(agentUid) && row.assignedTo === agentUid,
    requiresAgentUid: true,
    query: {
      equality: [{ field: "assignedTo", op: "==", valueFrom: "agentUid" }],
      range: null,
      orderBy: [{ field: "lastMessageAt", direction: "desc" }],
    },
  },
  "waiting-agent": {
    id: "waiting-agent",
    label: "Waiting For Agent",
    description: "Conversations with unread visitor messages for agents.",
    match: (row) => (row.unreadAgent ?? 0) > 0,
    requiresAgentUid: false,
    query: {
      equality: [],
      range: { field: "unreadAgent", op: ">", value: 0 },
      orderBy: [
        { field: "unreadAgent", direction: "desc" },
        { field: "lastMessageAt", direction: "desc" },
      ],
    },
  },
  "waiting-visitor": {
    id: "waiting-visitor",
    label: "Waiting For Visitor",
    description: "Conversations with unread agent messages for visitors.",
    match: (row) => (row.unreadVisitor ?? 0) > 0,
    requiresAgentUid: false,
    query: {
      equality: [],
      range: { field: "unreadVisitor", op: ">", value: 0 },
      orderBy: [
        { field: "unreadVisitor", direction: "desc" },
        { field: "lastMessageAt", direction: "desc" },
      ],
    },
  },
  closed: {
    id: "closed",
    label: "Closed",
    description: "Conversations marked closed.",
    match: (row) => String(row.status || "").toLowerCase() === "closed",
    requiresAgentUid: false,
    query: {
      equality: [{ field: "status", op: "==", value: "closed" }],
      range: null,
      orderBy: [{ field: "lastMessageAt", direction: "desc" }],
    },
  },
});

function getQueueDefinition(queueId) {
  const definition = QUEUE_DEFINITIONS[queueId];
  if (!definition) {
    const error = new Error("invalid_queue");
    error.status = 400;
    throw error;
  }
  return definition;
}

function listQueueDefinitions() {
  return QUEUE_IDS.map((id) => {
    const def = QUEUE_DEFINITIONS[id];
    return {
      id: def.id,
      label: def.label,
      description: def.description,
      requiresAgentUid: def.requiresAgentUid,
    };
  });
}

module.exports = {
  QUEUE_IDS,
  QUEUE_DEFINITIONS,
  getQueueDefinition,
  listQueueDefinitions,
};
