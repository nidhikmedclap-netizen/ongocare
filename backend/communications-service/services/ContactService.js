const { FieldValue } = require("firebase-admin/firestore");
const ContactRepository = require("../repositories/ContactRepository");
const { normalizeE164, buildContactKey } = require("../lib/phoneE164");

class ContactService {
  constructor(deps = {}) {
    this.repo = deps.contactRepository || new ContactRepository();
  }

  /**
   * Resolve an existing contact by deterministic E.164 doc ID, legacy phonesE164 query,
   * or create a new contact at the deterministic ID (prevents duplicate contacts on races).
   */
  async resolveOrCreateByPhone(e164, options = {}) {
    const normalized = normalizeE164(e164);
    if (!normalized) {
      throw new Error("valid E.164 phone number is required");
    }

    const contactKey = buildContactKey(normalized);
    if (contactKey) {
      const byKey = await this.repo.getById(contactKey);
      if (byKey) {
        return this.maybeUpdateExisting(byKey, options);
      }
    }

    const existing = await this.repo.findByE164(normalized);
    if (existing) {
      return this.maybeUpdateExisting(existing, options);
    }

    return this.repo.createWithId(contactKey, {
      phone: normalized,
      displayName: options.callerName || normalized,
      source: options.source || "twilio",
      callActivityAt: options.callActivityAt,
    });
  }

  async maybeUpdateExisting(existing, options = {}) {
    if (options.callerName && !existing.displayName) {
      return this.repo.update(existing.id, {
        displayName: String(options.callerName).trim(),
      });
    }
    return existing;
  }

  async recordCallActivity(contactId, activityAt) {
    if (!contactId) {
      throw new Error("contactId is required");
    }

    const timestamp = activityAt || FieldValue.serverTimestamp();
    return this.repo.update(contactId, {
      lastCallAt: timestamp,
      lastActivityAt: timestamp,
    });
  }
}

module.exports = ContactService;
