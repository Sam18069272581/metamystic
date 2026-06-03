"use client";

import Link from "next/link";
import { BaziChartCard } from "@/components/bazi/bazi-chart-card";
import { MobileShell } from "@/components/shell/mobile-shell";
import { useAppStore } from "@/store/app-store";

export default function BaziPage() {
  const chart = useAppStore((state) => state.chart);

  return (
    <MobileShell title="八字排盘">
      {chart ? (
        <BaziChartCard chart={chart} />
      ) : (
        <section className="mystic-card rounded-3xl p-5 text-center">
          <p className="text-sm leading-6 text-white/65">当前浏览器会话还没有命盘，请先完成一次 AI 命理咨询。</p>
          <Link href="/consult" className="gold-text mt-4 inline-block text-sm font-semibold">
            去生成命盘
          </Link>
        </section>
      )}
    </MobileShell>
  );
}
