"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, CupSoda, MessageCircle, Sparkles } from "lucide-react";

const entries = [
  { label: "AI 命理对话", href: "/consult", icon: MessageCircle, active: true },
  { label: "八字排盘", href: "/consult", icon: Sparkles, active: true },
  { label: "塔罗", href: "/", icon: BookOpen, active: false },
  { label: "圣杯", href: "/", icon: CupSoda, active: false }
];

export function HomeDashboard() {
  return (
    <div className="space-y-4">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mystic-card overflow-hidden rounded-3xl p-5"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/55">今日运势</p>
            <h1 className="mt-2 text-5xl font-semibold text-[#f2cf8d]">78</h1>
          </div>
          <div className="grid h-28 w-28 place-items-center rounded-full border border-[#d8a850]/25 bg-[#6d4bd0]/15 shadow-glow">
            <Sparkles className="h-10 w-10 text-[#f2cf8d]" />
          </div>
        </div>
        <p className="mt-4 rounded-2xl bg-white/5 p-4 text-sm leading-6 text-white/74">
          保护内心平衡，专注当下。机会通常藏在不轻易显露的选择里。
        </p>
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
          <span className="text-xs text-white/40">二期将接入 Feed</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <article className="mystic-card rounded-2xl p-4">
            <p className="text-sm font-medium text-white/85">2026 流年趋势</p>
            <p className="mt-3 text-xs leading-5 text-white/50">以命盘结构生成年度行动建议。</p>
          </article>
          <article className="mystic-card rounded-2xl p-4">
            <p className="text-sm font-medium text-white/85">关系问题入口</p>
            <p className="mt-3 text-xs leading-5 text-white/50">用温柔陪伴模式处理情绪型问题。</p>
          </article>
        </div>
      </section>
    </div>
  );
}
