"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { PublicCompatibilityShareDto } from "@metamystic/shared";
import { HeartHandshake, Sparkles } from "lucide-react";
import { MobileShell } from "@/components/shell/mobile-shell";
import { apiClient } from "@/lib/api-client";

export default function PublicCompatibilitySharePage() {
  const params = useParams<{ readingId: string }>();
  const [reading, setReading] = useState<PublicCompatibilityShareDto | undefined>();
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    void apiClient
      .getPublicCompatibilityShare(params.readingId)
      .then(setReading)
      .catch((unknownError: unknown) =>
        setError(unknownError instanceof Error ? unknownError.message : "合盘分享读取失败")
      );
  }, [params.readingId]);

  return (
    <MobileShell title="合盘分享">
      <div className="space-y-4">
        <section className="mystic-card rounded-3xl p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-200/20 bg-amber-200/10 text-amber-100">
              <HeartHandshake className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-white/45">{"MetaMystic 合盘分享"}</p>
              <h1 className="gold-text mt-1 truncate text-xl font-semibold">
                {reading ? `${reading.profiles.a.label} × ${reading.profiles.b.label}` : "八字合盘"}
              </h1>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-white/58">
            {"这是一份只读合盘结果，仅展示关系结构、互补点与沟通建议，不包含邮箱、出生时间或私密资料。"}
          </p>
          <Link
            href="/me"
            className="mt-4 block rounded-2xl bg-[#6d4bd0] px-4 py-3 text-center text-sm font-semibold text-white shadow-glow transition hover:bg-[#7b58df]"
          >
            {"生成我的合盘"}
          </Link>
          {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
        </section>

        {reading ? <ShareReadingCard reading={reading} /> : <div className="h-72 animate-pulse rounded-3xl border border-white/10 bg-white/5" />}
      </div>
    </MobileShell>
  );
}

function ShareReadingCard({ reading }: { reading: PublicCompatibilityShareDto }) {
  return (
    <section className="mystic-card rounded-3xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-white/42">{levelText(reading.level)}</p>
          <p className="gold-text mt-1 text-4xl font-semibold">{reading.overallScore}</p>
          <p className="mt-1 text-xs text-white/40">{"综合缘分分"}</p>
        </div>
        <Sparkles className="h-5 w-5 text-amber-100/70" />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <Dimension label="五行" score={reading.dimensions.fiveElement.score} summary={reading.dimensions.fiveElement.summary} />
        <Dimension label="天干" score={reading.dimensions.stems.score} summary={reading.dimensions.stems.summary} />
        <Dimension label="地支" score={reading.dimensions.branches.score} summary={reading.dimensions.branches.summary} />
        <Dimension label="日主" score={reading.dimensions.dayMasters.score} summary={reading.dimensions.dayMasters.summary} />
      </div>

      <TextBlock title="相处优势" items={reading.advantages} />
      <TextBlock title="风险提醒" items={reading.risks} />
      <TextBlock title="建议" items={reading.advice} />
      <p className="mt-4 text-[11px] leading-relaxed text-white/35">{reading.disclaimer}</p>
    </section>
  );
}

function Dimension({ label, score, summary }: { label: string; score: number; summary: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-white/45">{label}</p>
        <p className="text-sm font-semibold text-amber-100">{score}</p>
      </div>
      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-white/68">{summary}</p>
    </div>
  );
}

function TextBlock({ items, title }: { items: string[]; title: string }) {
  return (
    <div className="mt-4">
      <p className="text-xs text-white/40">{title}</p>
      <div className="mt-2 space-y-2">
        {items.map((item) => (
          <p key={item} className="rounded-2xl border border-white/8 bg-white/[0.035] px-3 py-2 text-xs leading-relaxed text-white/68">
            {item}
          </p>
        ))}
      </div>
    </div>
  );
}

function levelText(level: PublicCompatibilityShareDto["level"]): string {
  const labels: Record<PublicCompatibilityShareDto["level"], string> = {
    excellent: "高契合",
    good: "互补良好",
    balanced: "平衡可经营",
    challenging: "需要更多磨合"
  };
  return labels[level];
}
