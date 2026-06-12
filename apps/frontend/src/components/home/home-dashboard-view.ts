import type { DailyFortuneDto } from "@metamystic/shared";

export function getDailyFortunePrimaryAction(status: DailyFortuneDto["status"]): { href: string; label: string } {
  if (status === "needs_profile") {
    return {
      href: "/me",
      label: "\u5b8c\u5584\u6211\u7684\u6863\u6848"
    };
  }
  if (status === "needs_bazi_chart") {
    return {
      href: "/charts/bazi",
      label: "\u5b8c\u6210\u516b\u5b57\u6392\u76d8"
    };
  }
  return {
    href: "/consult",
    label: "\u5f00\u59cb AI \u547d\u7406\u5206\u6790"
  };
}
