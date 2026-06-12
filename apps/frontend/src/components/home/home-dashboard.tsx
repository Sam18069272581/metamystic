"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, CupSoda, MessageCircle, RefreshCw, Sparkles } from "lucide-react";
import type { DailyFortuneDto, FiveElement } from "@metamystic/shared";
import { ShareButton } from "@/components/share/share-button";
import { apiClient } from "@/lib/api-client";
import { getDailyFortunePrimaryAction } from "./home-dashboard-view";

const entries = [
  { label: "AI 命理对话", href: "/consult", icon: MessageCircle, active: true },
  { label: "八字排盘", href: "/charts/bazi", icon: Sparkles, active: true },
  { label: "知识库", href: "/consult", icon: BookOpen, active: true },
  { label: "圣杯决策", href: "/consult", icon: CupSoda, active: false }
];

const elementLabels: Record<FiveElement, string> = {
  wood: "木",
  fire: "火",
  earth: "土",
  metal: "金",
  water: "水"
};

export function HomeDashboard() {
  const [fortune, setFortune] = useState<DailyFortuneDto | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  async function loadFortune(): Promise<void> {
    setLoading(true);
    setError(undefined);
    try {
      setFortune(await apiClient.getTodayDailyFortune());
    } catch (unknownError: unknown) {
      setFortune(undefined);
      setError(unknownError instanceof Error ? unknownError.message : "今日签语读取失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadFortune();
  }, []);

  const display = fortune ?? fallbackFortune;
  const primaryAction = getDailyFortunePrimaryAction(display.status);
  const shareText = `${display.date} 今日签语：${display.score}分。${display.title} ${display.advice[0] ?? ""}`;

  return (
    <div className="space-y-4">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mystic-card overflow-hidden rounded-3xl p-5"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm text-white/55">{display.date} · 今日签语</p>
            <div className="mt-2 flex items-end gap-2">
              <h1 className="text-5xl font-semibold text-[#f2cf8d]">{loading ? "--" : display.score}</h1>
              <span className="pb-2 text-sm text-white/45">分</span>
            </div>
          </div>
          <div className="grid h-28 w-28 shrink-0 place-items-center rounded-full border border-[#d8a850]/25 bg-[#6d4bd0]/15 shadow-glow">
            <div className="text-center">
              <Sparkles className="mx-auto h-8 w-8 text-[#f2cf8d]" />
              <p className="mt-2 text-xs text-[#f2cf8d]">{elementLabels[display.element]}气</p>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-white/5 p-4">
          <p className="text-sm font-semibold text-white/86">{loading ? "正在读取今日签语" : display.title}</p>
          <p className="mt-2 text-sm leading-6 text-white/68">{loading ? "正在结合你的命盘结构生成今日建议。" : display.summary}</p>
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
            path="/"
            text={shareText}
            title="MetaMystic 今日签语"
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
          <h2 className="gold-text text-lg font-semibold">为你推荐</h2>
          <span className="text-xs text-white/40">下一步接入每日推送</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <article className="mystic-card rounded-2xl p-4">
            <p className="text-sm font-medium text-white/85">2026 流年趋势</p>
            <p className="mt-3 text-xs leading-5 text-white/50">结合命盘结构生成年度行动建议。</p>
          </article>
          <article className="mystic-card rounded-2xl p-4">
            <p className="text-sm font-medium text-white/85">关系问题入口</p>
            <p className="mt-3 text-xs leading-5 text-white/50">用温和陪伴模式处理情绪型问题。</p>
          </article>
        </div>
      </section>
    </div>
  );
}

const fallbackFortune: DailyFortuneDto = {
  date: new Date().toISOString().slice(0, 10),
  status: "needs_profile",
  score: 50,
  element: "water",
  title: "先建立你的命盘档案",
  summary: "登录并填写出生信息后，MetaMystic 会根据你的命盘生成每日签语。",
  advice: ["先完成基础档案", "再查看今日适合推进的事项"],
  cautions: ["未建立命盘前只显示通用提醒。"],
  luckyActions: ["适合学习、研究和深谈"]
};
