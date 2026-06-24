// Section 9 — payout banking details. Raw routing + account numbers are
// stored on the user document; flagged for migration to Stripe Connect
// before production launch (see /api/doctor/signup/route.js for context).

import styles from "../doctor-onboard.module.css";
import Section from "./Section";
import Field from "./Field";
import {
  sanitizeName,
  sanitizeBankName,
  NAME_LIMIT,
  BANK_NAME_MAX,
} from "@/app/weightloss-onboard/utils";

export default function BankingSection({
  values,
  updateBanking,
  routingValid,
  accountValid,
  showErrors = false,
  fieldErrors = {},
}) {
  const banking = values.banking;

  return (
    <Section
      number="8"
      title="Banking details (payouts)"
      description="Where we send your share of patient payments. US bank accounts only — routing number is 9 digits."
    >
      <Field
        label="Account holder name"
        required
        hint={showErrors && fieldErrors.accountHolder ? fieldErrors.accountHolder : undefined}
        hintTone={showErrors && fieldErrors.accountHolder ? "warn" : undefined}
      >
        <input
          className={styles.input}
          type="text"
          autoComplete="off"
          maxLength={NAME_LIMIT}
          value={banking.accountHolder}
          onChange={(e) =>
            updateBanking("accountHolder", sanitizeName(e.target.value))
          }
          placeholder="Vanessa A. Niles"
        />
      </Field>

      <div className={styles.row2}>
        <Field
          label="Bank name"
          required
          hint={showErrors && fieldErrors.bankName ? fieldErrors.bankName : undefined}
          hintTone={showErrors && fieldErrors.bankName ? "warn" : undefined}
        >
          <input
            className={styles.input}
            type="text"
            autoComplete="off"
            maxLength={BANK_NAME_MAX}
            value={banking.bankName}
            onChange={(e) =>
              updateBanking("bankName", sanitizeBankName(e.target.value))
            }
            placeholder="Chase Bank"
          />
        </Field>
        <Field label="Account type" required>
          <select
            className={styles.input}
            value={banking.accountType}
            onChange={(e) => updateBanking("accountType", e.target.value)}
          >
            <option value="checking">Checking</option>
            <option value="savings">Savings</option>
          </select>
        </Field>
      </div>

      <div className={styles.row2}>
        <Field
          label="Routing number"
          required
          hint={routingHint(banking.routingNumber, routingValid, showErrors, fieldErrors.routingNumber)}
          hintTone={routingTone(banking.routingNumber, routingValid, showErrors, fieldErrors.routingNumber)}
        >
          <input
            className={styles.input}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            maxLength={9}
            value={banking.routingNumber}
            onChange={(e) =>
              updateBanking("routingNumber", e.target.value.replace(/\D/g, "").slice(0, 9))
            }
            placeholder="123456789"
          />
        </Field>
        <Field
          label="Account number"
          required
          hint={accountHint(banking.accountNumber, accountValid, showErrors, fieldErrors.accountNumber)}
          hintTone={accountTone(banking.accountNumber, accountValid, showErrors, fieldErrors.accountNumber)}
        >
          <input
            className={styles.input}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            maxLength={17}
            value={banking.accountNumber}
            onChange={(e) =>
              updateBanking(
                "accountNumber",
                e.target.value.replace(/[^\d\s]/g, "").slice(0, 17),
              )
            }
            placeholder="000123456789"
          />
        </Field>
      </div>
      <p className={styles.bankNote}>
        🔒 Encrypted in transit. For production use, payouts should be routed
        through Stripe Connect rather than stored as plain numbers.
      </p>
    </Section>
  );
}

function routingHint(value, valid, showErrors, submitError) {
  if (showErrors && submitError) return submitError;
  if (value.length === 0) return "9-digit ABA routing";
  return valid ? "Looks good." : "Routing must be exactly 9 digits.";
}

function routingTone(value, valid, showErrors, submitError) {
  if (showErrors && submitError) return "warn";
  return value.length === 0 || valid ? "muted" : "warn";
}

function accountHint(value, valid, showErrors, submitError) {
  if (showErrors && submitError) return submitError;
  if (value.length === 0) return "Usually 6–17 digits";
  return valid ? "Looks good." : "Account number should be 6–17 digits.";
}

function accountTone(value, valid, showErrors, submitError) {
  if (showErrors && submitError) return "warn";
  return value.length === 0 || valid ? "muted" : "warn";
}
