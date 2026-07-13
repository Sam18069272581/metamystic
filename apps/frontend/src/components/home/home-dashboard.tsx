"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { BookOpen, CupSoda, MessageCircle, RefreshCw, Sparkles } from "lucide-react";
import type { DailyFortuneDto, FiveElement } from "@metamystic/shared";
import { ShareButton } from "@/components/share/share-button";
import { apiClient } from "@/lib/api-client";
import { getDictionary, oppositeLocale, switchLocalePath, type Locale, withLocale } from "@/lib/i18n";
import { getDailyFortunePrimaryAction } from "./home-dashboard-view";

export function HomeDashboard({ locale = "zh" }: { locale?: Locale }) {
  const dictionary = getDictionary(locale);
  const pathname = usePathname();
  const [fortune, setFortune] = useState<DailyFortuneDto | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  async function loadFortune(): Promise<void> {
    setLoading(true);
    setError(undefined);
    try {
      const user = await apiClient.me().catch(() => undefined);
      if (!user) {
        setFortune(undefined);
        return;
      }
      setFortune(await apiClient.getTodayDailyFortune());
    } catch (unknownError: unknown) {
      setFortune(undefined);
      setError(unknownError instanceof Error ? unknownError.message : dictionary.home.loadError);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadFortune();
  }, []);

  const display = fortune ?? buildFallbackFortune(locale);
  const primaryAction = getDailyFortunePrimaryAction(display.status, locale);
  const shareText = `${display.date} ${dictionary.home.dailyFortune}: ${display.score}${dictionary.home.scoreUnit}. ${display.title} ${
    display.advice[0] ?? ""
  }`;
  const targetLocale = oppositeLocale(locale);
  const entries = [
    { label: dictionary.home.entries.consult, href: withLocale("/consult", locale), icon: MessageCircle, active: true },
    { label: dictionary.home.entries.bazi, href: withLocale("/charts/bazi", locale), icon: Sparkles, active: true },
    { label: dictionary.home.entries.knowledge, href: withLocale("/consult", locale), icon: BookOpen, active: true },
    { label: dictionary.home.entries.decision, href: withLocale("/consult", locale), icon: CupSoda, active: false }
  ];

  return (
    <div className="space-y-4">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mystic-card overflow-hidden rounded-3xl p-5"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm text-white/55">
              <p>{display.date} · {dictionary.home.dailyFortune}</p>
              <Link
                href={switchLocalePath(pathname, targetLocale)}
                className="rounded-full border border-amber-200/20 bg-amber-200/10 px-2 py-0.5 text-xs font-semibold text-amber-100"
              >
                {dictionary.home.languageSwitch}
              </Link>
            </div>
            <div className="mt-2 flex items-end gap-2">
              <h1 className="text-5xl font-semibold text-[#f2cf8d]">{loading ? "--" : display.score}</h1>
              <span className="pb-2 text-sm text-white/45">{dictionary.home.scoreUnit}</span>
            </div>
          </div>
          <div className="grid h-28 w-28 shrink-0 place-items-center rounded-full border border-[#d8a850]/25 bg-[#6d4bd0]/15 shadow-glow">
            <div className="text-center">
              <Sparkles className="mx-auto h-8 w-8 text-[#f2cf8d]" />
              <p className="mt-2 text-xs text-[#f2cf8d]">
                {dictionary.home.elements[display.element]} {dictionary.home.elementSuffix}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-white/5 p-4">
          <p className="text-sm font-semibold text-white/86">{loading ? dictionary.home.loadingTitle : display.title}</p>
          <p className="mt-2 text-sm leading-6 text-white/68">{loading ? dictionary.home.loadingSummary : display.summary}</p>
          {error ? <p className="mt-2 text-xs leading-5 text-rose-300">{error}</p> : null}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {display.advice.slice(0, 2).map((item) => (
            <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-xs leading-5 text-white/62">
              {item}
            </div>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-[1fr_auto_auto] gap-2">
          <Link
            href={primaryAction.href}
            className="rounded-2xl bg-[#6d4bd0] px-4 py-3 text-center text-sm font-semibold text-white shadow-glow transition hover:bg-[#7b58df]"
          >
            {primaryAction.label}
          </Link>
          <ShareButton
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-amber-200/20 bg-amber-200/10 px-3 text-sm font-semibold text-amber-100 transition hover:bg-amber-200/15"
            labels={dictionary.home.shareLabels}
            path={withLocale("/", locale)}
            text={shareText}
            title={dictionary.home.shareTitle}
          />
          <button
            className="grid h-12 w-12 place-items-center rounded-2xl border border-amber-200/20 bg-amber-200/10 text-amber-100 transition hover:bg-amber-200/15"
            onClick={() => void loadFortune()}
            type="button"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </motion.section>

      <section className="grid grid-cols-4 gap-3">
        {entries.map((entry) => {
          const Icon = entry.icon;
          return (
            <Link
              key={entry.label}
              href={entry.href}
              className={`mystic-card flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl text-center text-xs ${
                entry.active ? "text-[#f2cf8d]" : "text-white/35"
              }`}
            >
              <Icon className="h-5 w-5" />
              {entry.label}
            </Link>
          );
        })}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="gold-text text-lg font-semibold">{dictionary.home.recommendationsTitle}</h2>
          <span className="text-xs text-white/40">{dictionary.home.recommendationsHint}</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <article className="mystic-card rounded-2xl p-4">
            <p className="text-sm font-medium text-white/85">{dictionary.home.yearlyTrendTitle}</p>
            <p className="mt-3 text-xs leading-5 text-white/50">{dictionary.home.yearlyTrendSummary}</p>
          </article>
          <article className="mystic-card rounded-2xl p-4">
            <p className="text-sm font-medium text-white/85">{dictionary.home.relationshipTitle}</p>
            <p className="mt-3 text-xs leading-5 text-white/50">{dictionary.home.relationshipSummary}</p>
          </article>
        </div>
      </section>
    </div>
  );
}

function buildFallbackFortune(locale: Locale): DailyFortuneDto {
  const dictionary = getDictionary(locale);
  return {
    date: new Date().toISOString().slice(0, 10),
    status: "needs_profile",
    score: 50,
    element: "water",
    title: dictionary.home.fallbackTitle,
    summary: dictionary.home.fallbackSummary,
    advice: [...dictionary.home.fallbackAdvice],
    cautions: [dictionary.home.fallbackCaution],
    luckyActions: [dictionary.home.fallbackLuckyAction]
  };
}
