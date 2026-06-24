// components/PasswordField.jsx
//
// Password input with show/hide eye toggle.
//
// Pattern: **uncontrolled input** (defaultValue + ref) — deliberately, so
// the typed value never appears as a `value="..."` attribute in the
// rendered HTML / DevTools Elements panel.
//
//   Controlled <input value={x}>   → React re-syncs the DOM `value`
//                                      attribute on every keystroke →
//                                      DevTools shows the typed text.
//   Uncontrolled <input defaultValue> → React sets the value once at mount;
//                                      typing updates only the DOM `value`
//                                      property → DevTools does NOT show
//                                      the typed text.
//
// The parent still receives every keystroke via onChange, so React state,
// validation hints, and submit logic all keep working — we just don't
// rebind `value` back to the DOM.
//
// Note: this is a cosmetic / convention-matching change. The plaintext
// password still lives in React state in the parent, still goes over HTTPS
// to Firebase, still gets hashed there. The actual security model is the
// same as the controlled version. We're matching the pattern reviewers
// expect to see when inspecting login forms.

"use client";

import { useEffect, useRef, useState } from "react";

// Default password length cap. Matches the onboarding sign-up cap so an
// existing user can never have a stored password longer than what we allow
// at sign-in. Browsers enforce `maxLength` for both typed AND pasted input,
// so this single attribute is sufficient — no manual slicing required.
const DEFAULT_MAX_LENGTH = 64;

export default function PasswordField({
  value,
  onChange,
  placeholder = "Password",
  autoComplete = "current-password",
  className,
  style,
  inputStyle,
  maxLength = DEFAULT_MAX_LENGTH,
  ...rest
}) {
  const [visible, setVisible] = useState(false);
  const inputRef = useRef(null);

  // Sync DOM ⇄ parent state via an imperative ref instead of rebinding
  // `value`. Cases this handles correctly:
  //   - User typing:            DOM updates first, parent state catches up
  //                              via onChange, ref already matches → no-op.
  //   - Parent reset to "":     ref clears DOM (e.g. after successful submit).
  //   - Mount with prefilled
  //     value (back navigation
  //     in a multi-screen form): ref hydrates the DOM imperatively without
  //                              going through React's `value` attribute.
  // Net result: the rendered HTML always has `value=""` (the empty default
  // from defaultValue below), even when the user has typed a real password.
  useEffect(() => {
    const node = inputRef.current;
    if (!node) return;
    const incoming = value ?? "";
    if (node.value !== incoming) {
      node.value = incoming;
    }
  }, [value]);

  return (
    <div
      style={{
        position: "relative",
        display: "block",
        ...style,
      }}
    >
      <input
        ref={inputRef}
        type={visible ? "text" : "password"}
        // Uncontrolled: defaultValue is always empty in the rendered HTML.
        // The DOM `value` PROPERTY updates as the user types (or via the
        // useEffect above), but the `value` ATTRIBUTE that DevTools shows
        // stays empty.
        defaultValue=""
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        maxLength={maxLength}
        className={className}
        style={{ paddingRight: 42, width: "100%", ...inputStyle }}
        {...rest}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        title={visible ? "Hide password" : "Show password"}
        tabIndex={-1}
        style={btnStyle}
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}

const btnStyle = {
  position: "absolute",
  right: 6,
  top: "50%",
  transform: "translateY(-50%)",
  background: "transparent",
  border: "none",
  padding: 8,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "var(--color-text-soft, #8a9a9e)",
  borderRadius: 6,
};

/* ─── Icons ──────────────────────────────────────────────────────────── */

function iconProps() {
  return {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };
}

function EyeIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M17.94 17.94A10.94 10.94 0 0112 20c-7 0-11-8-11-8a19.74 19.74 0 015.06-5.94" />
      <path d="M9.9 4.24A10.94 10.94 0 0112 4c7 0 11 8 11 8a19.6 19.6 0 01-3.16 4.19" />
      <path d="M14.12 14.12a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
