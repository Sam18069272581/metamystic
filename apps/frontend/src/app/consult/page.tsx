"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { BaziChartCard } from "@/components/bazi/bazi-chart-card";
import { ConsultationForm } from "@/components/consultation/consultation-form";
import { ConsultationHistoryPanel } from "@/components/consultation/consultation-history-panel";
import { ConsultationStream } from "@/components/consultation/consultation-stream";
import { RecentConsultationsPanel } from "@/components/consultation/recent-consultations-panel";
import { ProfileMemoryPanel } from "@/components/profile/profile-memory-panel";
import { MobileShell } from "@/components/shell/mobile-shell";
import { getDictionary, getLocaleFromPathname, type Locale } from "@/lib/i18n";
import { useAppStore } from "@/store/app-store";

export default function ConsultPage() {
  const locale = getLocaleFromPathname(usePathname());
  return (
    <Suspense fallback={<ConsultPageFallback locale={locale} />}>
      <ConsultPageContent locale={locale} />
    </Suspense>
  );
}

function ConsultPageContent({ locale }: { locale: Locale }) {
  const searchParams = useSearchParams();
  const dictionary = getDictionary(locale);
  const chart = useAppStore((state) => state.chart);
  const consultations = useAppStore((state) => state.consultations);
  const history = useAppStore((state) => state.history);
  const memory = useAppStore((state) => state.memory);
  const providerStatus = useAppStore((state) => state.providerStatus);
  const streamSections = useAppStore((state) => state.streamSections);

  return (
    <MobileShell locale={locale} title={dictionary.pages.consult}>
      <div className="space-y-4">
        <ConsultationForm
          locale={locale}
          initialChartId={searchParams.get("chartId") ?? undefined}
          initialProfileId={searchParams.get("profileId") ?? undefined}
        />
        {chart ? <BaziChartCard chart={chart} /> : null}
        <ConsultationStream providerStatus={providerStatus} sections={streamSections} />
        <ProfileMemoryPanel memory={memory} />
        <RecentConsultationsPanel consultations={consultations} />
        <ConsultationHistoryPanel history={history} />
      </div>
    </MobileShell>
  );
}

function ConsultPageFallback({ locale }: { locale: Locale }) {
  const dictionary = getDictionary(locale);
  return (
    <MobileShell locale={locale} title={dictionary.pages.consult}>
      <div className="space-y-4">
        <div className="h-40 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
        <div className="h-64 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
      </div>
    </MobileShell>
  );
}
