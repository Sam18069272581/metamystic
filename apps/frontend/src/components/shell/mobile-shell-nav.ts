import type { LucideIcon } from "lucide-react";
import { Home, MessageCircle, MoonStar, UserRound } from "lucide-react";

export interface MobileShellNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const mobileShellNavItems: MobileShellNavItem[] = [
  { href: "/", label: "首页", icon: Home },
  { href: "/consult", label: "AI", icon: MessageCircle },
  { href: "/charts/bazi", label: "命盘", icon: MoonStar },
  { href: "/me", label: "我的", icon: UserRound }
];
