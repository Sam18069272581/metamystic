"use client";

import { usePathname } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { MobileShell } from "@/components/shell/mobile-shell";
import { getDictionary, getLocaleFromPathname } from "@/lib/i18n";

export default function LoginPage() {
  const locale = getLocaleFromPathname(usePathname());
  const dictionary = getDictionary(locale);
  return (
    <MobileShell locale={locale} title={dictionary.pages.login}>
      <AuthForm mode="login" />
    </MobileShell>
  );
}
