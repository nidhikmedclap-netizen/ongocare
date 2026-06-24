"use client";

import { AuthProvider } from "@/lib/auth/AuthProvider";
import AuthSessionGuard from "@/lib/auth/AuthSessionGuard";
import AppToaster from "@/components/ui/app-toaster";
import ConfirmProvider from "@/components/ui/confirm-provider";

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <ConfirmProvider>
        <AuthSessionGuard />
        {children}
        <AppToaster />
      </ConfirmProvider>
    </AuthProvider>
  );
}
