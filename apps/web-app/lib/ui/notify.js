import { toast } from "sonner";
import {
  ERROR_FALLBACKS,
  resolveErrorFallback,
  userErrorMessage,
} from "@/lib/ui/userErrorMessage";

const DEFAULT_FORM_MESSAGE = "Please check the form details below.";

/** Scroll to the first visible validation hint in the current view. */
export function scrollToFirstFormError() {
  if (typeof document === "undefined") return;
  const el = document.querySelector(
    '[aria-invalid="true"], .field-err, [data-field-error="true"]',
  );
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  const focusable = el.matches("input,select,textarea,button")
    ? el
    : el.querySelector("input,select,textarea,button");
  focusable?.focus?.({ preventScroll: true });
}

export function toastSuccess(message, description) {
  toast.success(message, description ? { description } : undefined);
}

export function toastError(message, description) {
  toast.error(message, description ? { description } : undefined);
}

/**
 * Show a toast from an API / caught error with sanitized copy.
 * @returns {string} The message shown to the user (for inline `setError`).
 */
export function toastApiError(error, options = ERROR_FALLBACKS.generic) {
  const opts = typeof options === "string" ? { fallback: options } : options;
  const fallback = resolveErrorFallback(opts.fallback);
  const detail = userErrorMessage(error, fallback);

  if (opts.title) {
    toastError(opts.title, opts.description ?? detail);
    return opts.description ?? detail;
  }

  toastError(detail, opts.description);
  return detail;
}

export function toastInfo(message, description) {
  toast.info(message, description ? { description } : undefined);
}

export function toastWarning(message, description) {
  toast.warning(message, description ? { description } : undefined);
}

/** Long-form validation: keep inline errors, add a top-level alert + scroll. */
export function toastFormInvalid(
  message = DEFAULT_FORM_MESSAGE,
  description = "Some required fields still need your attention.",
) {
  toast.warning(message, { description });
  scrollToFirstFormError();
}

let confirmHandler = null;

/** Registered by ConfirmProvider on mount. */
export function setConfirmHandler(handler) {
  confirmHandler = handler;
}

/**
 * @param {{ title: string, description?: string, confirmLabel?: string, cancelLabel?: string, destructive?: boolean }} options
 * @returns {Promise<boolean>}
 */
export async function confirmAction(options) {
  if (confirmHandler) {
    return confirmHandler(options);
  }
  return window.confirm(
    [options.title, options.description].filter(Boolean).join("\n\n"),
  );
}
