import type { DailyFortuneDto } from "@metamystic/shared";
import { getDictionary, type Locale, withLocale } from "../../lib/i18n";

export function getDailyFortunePrimaryAction(
  status: DailyFortuneDto["status"],
  locale: Locale = "zh"
): { href: string; label: string } {
  const dictionary = getDictionary(locale);
  if (status === "needs_profile") {
    return {
      href: withLocale("/me", locale),
      label: dictionary.home.primaryActions.needsProfile
    };
  }
  if (status === "needs_bazi_chart") {
    return {
      href: withLocale("/charts/bazi", locale),
      label: dictionary.home.primaryActions.needsBaziChart
    };
  }
  return {
    href: withLocale("/consult", locale),
    label: dictionary.home.primaryActions.ready
  };
}
