"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { BaziChartCard } from "@/components/bazi/bazi-chart-card";
import { ConsultationForm } from "@/components/consultation/consultation-form";
import { ConsultationHistoryPanel } from "@/components/consultation/consultation-history-panel";
import { ConsultationStream } from "@/components/consultation/consultation-stream";
import { RecentConsultationsPanel } from "@/components/consultation/recent-consultations-panel";
import { ProfileMemoryPanel } from "@/components/profile/profile-memory-panel";
import { MobileShell } from "@/components/shell/mobile-shell";
import { useAppStore } from "@/store/app-store";

export default function ConsultPage() {
  return (
    <Suspense fallback={<ConsultPageFallback />}>
      <ConsultPageContent />
    </Suspense>
  );
}

function ConsultPageContent() {
  const searchParams = useSearchParams();
  const chart = useAppStore((state) => state.chart);
  const consultations = useAppStore((state) => state.consultations);
  const history = useAppStore((state) => state.history);
  const memory = useAppStore((state) => state.memory);
  const streamSections = useAppStore((state) => state.streamSections);

  return (
    <MobileShell title={"AI \u547d\u7406\u5bf9\u8bdd"}>
      <div className="space-y-4">
        <ConsultationForm
          initialChartId={searchParams.get("chartId") ?? undefined}
          initialProfileId={searchParams.get("profileId") ?? undefined}
        />
        {chart ? <BaziChartCard chart={chart} /> : null}
        <ConsultationStream sections={streamSections} />
        <ProfileMemoryPanel memory={memory} />
        <RecentConsultationsPanel consultations={consultations} />
        <ConsultationHistoryPanel history={history} />
      </div>
    </MobileShell>
  );
}

function ConsultPageFallback() {
  return (
    <MobileShell title={"AI \u547d\u7406\u5bf9\u8bdd"}>
      <div className="space-y-4">
        <div className="h-40 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
        <div className="h-64 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
      </div>
    </MobileShell>
  );
}
