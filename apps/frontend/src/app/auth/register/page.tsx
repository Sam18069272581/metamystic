"use client";

import { AuthForm } from "@/components/auth/auth-form";
import { MobileShell } from "@/components/shell/mobile-shell";

export default function RegisterPage() {
  return (
    <MobileShell title={"\u6ce8\u518c"}>
      <AuthForm mode="register" />
    </MobileShell>
  );
}
