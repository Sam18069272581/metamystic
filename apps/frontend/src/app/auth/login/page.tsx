"use client";

import { AuthForm } from "@/components/auth/auth-form";
import { MobileShell } from "@/components/shell/mobile-shell";

export default function LoginPage() {
  return (
    <MobileShell title={"\u767b\u5f55"}>
      <AuthForm mode="login" />
    </MobileShell>
  );
}
