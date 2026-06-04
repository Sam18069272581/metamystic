"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { BaziChartDto, PublicBaziShareDto } from "@metamystic/shared";
import { BaziChartCard } from "@/components/bazi/bazi-chart-card";
import { MobileShell } from "@/components/shell/mobile-shell";
import { apiClient } from "@/lib/api-client";

export default function PublicBaziSharePage() {
  const params = useParams<{ chartId: string }>();
  const [chart, setChart] = useState<PublicBaziShareDto | undefined>();
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    void apiClient
      .getPublicBaziShareChart(params.chartId)
      .then(setChart)
      .catch((unknownError: unknown) =>
        setError(unknownError instanceof Error ? unknownError.message : "分享命盘读取失败")
      );
  }, [params.chartId]);

  return (
    <MobileShell title="命盘分享">
      <div className="space-y-4">
        <section className="mystic-card rounded-3xl p-4">
          <p className="text-xs text-white/45">MetaMystic 分享命盘</p>
          <h1 className="gold-text mt-1 text-xl font-semibold">{chart?.mainPattern ?? "八字命盘"}</h1>
          <p className="mt-2 text-sm leading-6 text-white/58">
            这是一个只读分享页，仅展示命盘结构与分析摘要，不包含邮箱、昵称或出生时间。
          </p>
          <Link
            href="/charts/bazi"
            className="mt-4 block rounded-2xl bg-[#6d4bd0] px-4 py-3 text-center text-sm font-semibold text-white shadow-glow transition hover:bg-[#7b58df]"
          >
            生成我的命盘
          </Link>
          {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
        </section>

        {chart ? (
          <BaziChartCard chart={toDisplayChart(chart)} />
        ) : (
          <div className="h-72 animate-pulse rounded-3xl border border-white/10 bg-white/5" />
        )}
      </div>
    </MobileShell>
  );
}

function toDisplayChart(chart: PublicBaziShareDto): BaziChartDto {
  return {
    ...chart,
    profileId: ""
  };
}
