"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type {
  AstrologyChartDto,
  BaziChartDto,
  UserChartDetailDto,
  UserChartKind,
  ZiweiChartDto
} from "@metamystic/shared";
import { AstrologyChartBoard } from "@/components/astrology/astrology-chart-board";
import { BaziChartCard } from "@/components/bazi/bazi-chart-card";
import { BaziShareActions } from "@/components/chart-share/bazi-share-actions";
import { MobileShell } from "@/components/shell/mobile-shell";
import { ZiweiChartBoard } from "@/components/ziwei/ziwei-chart-board";
import { apiClient } from "@/lib/api-client";

export default function MyChartDetailPage() {
  const params = useParams<{ kind: UserChartKind; chartId: string }>();
  const [detail, setDetail] = useState<UserChartDetailDto | undefined>();
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    void apiClient
      .getMyChart(params.kind, params.chartId)
      .then(setDetail)
      .catch((unknownError: unknown) => setError(unknownError instanceof Error ? unknownError.message : "\u547d\u76d8\u8bfb\u53d6\u5931\u8d25"));
  }, [params.chartId, params.kind]);

  return (
    <MobileShell title={titleOf(params.kind)}>
      <div className="space-y-4">
        <section className="mystic-card rounded-3xl p-4">
          <p className="gold-text text-lg font-semibold">{"\u5386\u53f2\u547d\u76d8\u8be6\u60c5"}</p>
          <p className="mt-1 text-xs text-white/42">{"\u53ea\u8bfb\u5b58\u6863\uff0c\u7528\u4e8e\u56de\u987e\u548c AI \u4e0a\u4e0b\u6587"}</p>
          {detail ? <p className="mt-3 text-xs text-white/35">{new Date(detail.chart.createdAt).toLocaleString("zh-CN")}</p> : null}
          {detail?.kind === "bazi" ? (
            <Link
              href={`/consult?profileId=${encodeURIComponent(detail.chart.profileId)}&chartId=${encodeURIComponent(detail.chart.id)}`}
              className="mt-4 block rounded-2xl bg-[#6d4bd0] px-4 py-3 text-center text-sm font-semibold text-white shadow-glow transition hover:bg-[#7b58df]"
            >
              {"\u7528\u8fd9\u5f20\u547d\u76d8\u53d1\u8d77 AI \u89e3\u8bfb"}
            </Link>
          ) : null}
          {detail?.kind === "bazi" ? <BaziShareActions chartId={detail.chart.id} /> : null}
          {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
        </section>

        {detail?.kind === "bazi" && isBaziChart(detail.chart) ? <BaziChartCard chart={detail.chart} /> : null}
        {detail?.kind === "ziwei" && isZiweiChart(detail.chart) ? <ZiweiChartBoard chart={detail.chart} /> : null}
        {detail?.kind === "astrology" && isAstrologyChart(detail.chart) ? <AstrologyChartBoard chart={detail.chart} /> : null}
      </div>
    </MobileShell>
  );
}

function titleOf(kind: UserChartKind): string {
  return {
    bazi: "\u516b\u5b57\u8be6\u60c5",
    ziwei: "\u7d2b\u5fae\u8be6\u60c5",
    astrology: "\u661f\u76d8\u8be6\u60c5"
  }[kind];
}

function isBaziChart(chart: UserChartDetailDto["chart"]): chart is BaziChartDto {
  return "pillars" in chart;
}

function isZiweiChart(chart: UserChartDetailDto["chart"]): chart is ZiweiChartDto {
  return "palaces" in chart;
}

function isAstrologyChart(chart: UserChartDetailDto["chart"]): chart is AstrologyChartDto {
  return "placements" in chart;
}
