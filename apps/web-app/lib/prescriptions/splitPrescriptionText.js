// Split rendered prescription text so the signature can sit after the
// titration schedule (bottom right of the document).

const TITRATION_SPLIT = "\n\nTitration Schedule";

export function splitPrescriptionText(text) {
  const raw = String(text ?? "");
  const idx = raw.indexOf(TITRATION_SPLIT);
  if (idx === -1) {
    return { body: raw.trimEnd(), footer: "" };
  }
  return {
    body: raw.slice(0, idx).trimEnd(),
    footer: raw.slice(idx + 2).trimStart(),
  };
}
