"use client";

import { createContext, useContext } from "react";

const OnboardContext = createContext(null);

export const OnboardProvider = OnboardContext.Provider;

export function useOnboard() {
  const ctx = useContext(OnboardContext);
  if (!ctx) {
    throw new Error("useOnboard must be used inside <OnboardProvider>");
  }
  return ctx;
}

// Returns merged content for a screen — caller provides defaults, we layer the
// org overrides (from ctx.content?.[screenId]) on top. Screens use this so they
// can keep their hardcoded defaults inline while still being tenant-overridable.
export function useScreenContent(screenId, defaults) {
  const { content } = useOnboard();
  const override = content?.[screenId];
  if (!override) return defaults;
  return { ...defaults, ...override };
}
