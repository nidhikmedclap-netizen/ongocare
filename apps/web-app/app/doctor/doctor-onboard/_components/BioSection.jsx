// Section 4 — professional bio. 30-character minimum so it isn't blank
// when shown to patients on the clinician picker.

import styles from "../doctor-onboard.module.css";
import Section from "./Section";
import Field from "./Field";
import { BIO_MAX } from "@/app/weightloss-onboard/utils";

const MIN_LENGTH = 30;

export default function BioSection({
  values,
  update,
  showErrors = false,
  fieldErrors = {},
}) {
  const length = values.bio.trim().length;
  const submitError = showErrors ? fieldErrors.bio : "";

  return (
    <Section number="4" title="About you">
      <Field
        label="Professional bio"
        required
        hint={
          submitError ||
          `${length}/${BIO_MAX} characters · minimum ${MIN_LENGTH}`
        }
        hintTone={submitError || length < MIN_LENGTH ? "warn" : "muted"}
      >
        <textarea
          className={`${styles.input} ${styles.textarea}`}
          rows={5}
          maxLength={BIO_MAX}
          value={values.bio}
          onChange={(e) => update("bio", e.target.value.slice(0, BIO_MAX))}
          placeholder="Board-certified physician with 10+ years in metabolic health. Trained at…"
        />
      </Field>
    </Section>
  );
}
