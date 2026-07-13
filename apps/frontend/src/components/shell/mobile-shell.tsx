import Link from "next/link";
import type { ReactNode } from "react";
import { MoonStar } from "lucide-react";
import type { Locale } from "../../lib/i18n";
import { getDictionary } from "../../lib/i18n";
import { getMobileShellNavItems, mobileShellStatusLabel } from "./mobile-shell-nav";

interface MobileShellProps {
  locale?: Locale;
  title?: string;
  children: ReactNode;
}

export function MobileShell({ locale = "zh", title = "MetaMystic", children }: MobileShellProps) {
  const dictionary = getDictionary(locale);
  const navItems = getMobileShellNavItems(locale);
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col px-4 py-4">
      <header className="mb-4 flex items-center justify-between text-sm text-white/70">
        <span>9:41</span>
        <span className="gold-text text-base font-semibold tracking-wide">{title}</span>
        <span aria-label={dictionary.shell.statusLabel || mobileShellStatusLabel} className="text-[#f2cf8d]">
          <MoonStar className="h-4 w-4" aria-hidden />
        </span>
      </header>
      <section className="flex-1 pb-28">{children}</section>
      <nav className="fixed bottom-4 left-1/2 z-20 grid w-[min(398px,calc(100vw-32px))] -translate-x-1/2 grid-cols-4 rounded-[28px] border border-white/10 bg-[#0c1020]/90 px-3 py-2 shadow-glow backdrop-blur-xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              className="flex flex-col items-center gap-1 rounded-2xl px-2 py-1 text-[11px] text-white/55 transition hover:text-[#f2cf8d]"
            >
              <Icon className="h-5 w-5" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </main>
  );
}
