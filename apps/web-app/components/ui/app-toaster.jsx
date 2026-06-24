"use client";

import { Toaster } from "sonner";

export default function AppToaster() {
  return (
    <Toaster
      position="top-center"
      closeButton
      richColors
      style={{ zIndex: 100000 }}
      toastOptions={{
        classNames: {
          toast:
            "font-[family-name:var(--font-site)] border border-[var(--color-border)] shadow-lg",
          title: "text-[var(--color-text)] font-semibold",
          description: "text-[var(--color-text-muted)]",
        },
      }}
    />
  );
}
