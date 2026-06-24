const HUB_PERMISSIONS = Object.freeze({
  INBOX_READ: "inbox:read",
  INBOX_WRITE: "inbox:write",
  SMS_SEND: "sms:send",
  CALLS_READ: "calls:read",
  CHAT_ASSIGN: "chat:assign",
});

const MEMBERSHIP_ROLES = Object.freeze(["agent", "admin", "viewer"]);

const ROLE_DEFAULT_PERMISSIONS = Object.freeze({
  viewer: [
    HUB_PERMISSIONS.INBOX_READ,
    HUB_PERMISSIONS.CALLS_READ,
  ],
  agent: [
    HUB_PERMISSIONS.INBOX_READ,
    HUB_PERMISSIONS.INBOX_WRITE,
    HUB_PERMISSIONS.SMS_SEND,
    HUB_PERMISSIONS.CALLS_READ,
  ],
  admin: [
    HUB_PERMISSIONS.INBOX_READ,
    HUB_PERMISSIONS.INBOX_WRITE,
    HUB_PERMISSIONS.SMS_SEND,
    HUB_PERMISSIONS.CALLS_READ,
    HUB_PERMISSIONS.CHAT_ASSIGN,
  ],
});

function permissionsForRole(role) {
  const key = String(role || "").trim().toLowerCase();
  return ROLE_DEFAULT_PERMISSIONS[key] || [];
}

function normalizePermissions(input, role) {
  if (Array.isArray(input) && input.length) {
    return [...new Set(input.map((value) => String(value).trim()).filter(Boolean))];
  }
  return permissionsForRole(role);
}

module.exports = {
  HUB_PERMISSIONS,
  MEMBERSHIP_ROLES,
  ROLE_DEFAULT_PERMISSIONS,
  permissionsForRole,
  normalizePermissions,
};
