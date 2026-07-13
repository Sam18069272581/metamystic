import type { LucideIcon } from "lucide-react";
import { Home, MessageCircle, MoonStar, UserRound } from "lucide-react";
import { getDictionary, type Locale, withLocale } from "../../lib/i18n";

export interface MobileShellNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const mobileShellStatusLabel = "夜间模式";

export function getMobileShellNavItems(locale: Locale): MobileShellNavItem[] {
  const dictionary = getDictionary(locale);
  return [
    { href: withLocale("/", locale), label: dictionary.shell.nav.home, icon: Home },
    { href: withLocale("/consult", locale), label: dictionary.shell.nav.consult, icon: MessageCircle },
    { href: withLocale("/charts/bazi", locale), label: dictionary.shell.nav.bazi, icon: MoonStar },
    { href: withLocale("/me", locale), label: dictionary.shell.nav.me, icon: UserRound }
  ];
}
