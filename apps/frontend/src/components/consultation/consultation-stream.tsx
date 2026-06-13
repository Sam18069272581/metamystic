"use client";

import type { ConsultationProviderEvent } from "@metamystic/shared";
import type { StreamSections } from "@/store/app-store";
import { BookOpenText, BrainCircuit, Lightbulb, RadioTower, ShieldCheck, Sparkles, Target } from "lucide-react";
import type { ComponentType } from "react";
import { parseCitationContent } from "./citation-parser";
import { formatProviderStatus } from "./consultation-provider-status";

const sectionMeta: Record<
  keyof StreamSections,
  {
    label: string;
    badge: string;
    description: string;
    Icon: ComponentType<{ className?: string }>;
  }
> = {
  verdict: {
    label: "\u7ed3\u8bba",
    badge: "AI",
    description: "\u6a21\u578b\u7efc\u5408\u547d\u76d8\u4e0e\u77e5\u8bc6\u5e93\u540e\u7684\u7b56\u7565\u5224\u65ad",
    Icon: Sparkles
  },
  logic: {
    label: "\u547d\u7406\u903b\u8f91",
    badge: "\u63a8\u65ad",
    description: "\u57fa\u4e8e\u516b\u5b57\u7ed3\u6784\u7684\u89e3\u91ca\u94fe\u8def",
    Icon: BrainCircuit
  },
  factors: {
    label: "\u547d\u76d8\u89e6\u53d1\u70b9",
    badge: "\u56e0\u7d20",
    description: "\u628a\u65e5\u4e3b\u5f3a\u5f31\u3001\u5341\u795e\u3001\u795e\u715e\u4e0e\u95ee\u9898\u7684\u5173\u8054\u62c6\u5f00",
    Icon: Target
  },
  advice: {
    label: "\u73b0\u5b9e\u5efa\u8bae",
    badge: "\u884c\u52a8",
    description: "\u53ef\u5728\u73b0\u5b9e\u4e2d\u9a8c\u8bc1\u7684\u4e0b\u4e00\u6b65",
    Icon: Lightbulb
  },
  citation: {
    label: "\u53c2\u8003\u4f9d\u636e",
    badge: "RAG",
    description: "\u6765\u81ea\u77e5\u8bc6\u5e93\u7684\u53ef\u8ffd\u6eaf\u7247\u6bb5",
    Icon: BookOpenText
  },
  disclaimer: {
    label: "\u7406\u6027\u63d0\u793a",
    badge: "\u98ce\u63a7",
    description: "\u51b3\u7b56\u8fb9\u754c\u4e0e\u5b89\u5168\u63d0\u9192",
    Icon: ShieldCheck
  }
};

export function ConsultationStream({
  providerStatus,
  sections
}: {
  providerStatus?: ConsultationProviderEvent | undefined;
  sections: StreamSections;
}) {
  return (
    <div className="space-y-3">
      {providerStatus ? <ProviderStatusCard status={providerStatus} /> : null}
      {(Object.entries(sections) as Array<[keyof StreamSections, string]>)
        .filter(([, value]) => value.trim().length > 0)
        .map(([section, content]) => {
          const meta = sectionMeta[section];
          const Icon = meta.Icon;

          if (section === "citation") {
            const citations = parseCitationContent(content);
            return (
              <article key={section} className="mystic-card rounded-2xl p-4">
                <SectionHeader Icon={Icon} badge={meta.badge} description={meta.description} label={meta.label} />
                <div className="mt-3 space-y-2">
                  {citations.map((citation) => (
                    <div key={`${citation.key}-${citation.topicLabel}`} className="rounded-2xl border border-white/8 bg-white/[0.04] p-3">
                      <div className="flex items-center justify-between gap-3 text-xs text-white/48">
                        <span className="gold-text font-semibold">[{citation.key}]</span>
                        <span className="truncate">{citation.sourceTitle}</span>
                        <span className="shrink-0 rounded-full bg-amber-200/10 px-2 py-0.5 text-amber-100/80">
                          {citation.topicLabel}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-white/74">{citation.content}</p>
                    </div>
                  ))}
                </div>
              </article>
            );
          }

          return (
            <article key={section} className="mystic-card rounded-2xl p-4">
              <SectionHeader Icon={Icon} badge={meta.badge} description={meta.description} label={meta.label} />
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-white/74">{content}</p>
            </article>
          );
        })}
    </div>
  );
}

function ProviderStatusCard({ status }: { status: ConsultationProviderEvent }) {
  const viewModel = formatProviderStatus(status);
  const toneClass =
    viewModel.tone === "fallback"
      ? "border-amber-200/25 bg-amber-200/[0.08] text-amber-50"
      : "border-violet-200/20 bg-violet-300/[0.07] text-violet-50";

  return (
    <div className={`rounded-2xl border px-4 py-3 ${toneClass}`}>
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-current/20 bg-black/10">
          <RadioTower className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold">{viewModel.title}</p>
          <p className="mt-1 text-xs leading-5 text-white/58">{viewModel.detail}</p>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({
  Icon,
  badge,
  description,
  label
}: {
  Icon: ComponentType<{ className?: string }>;
  badge: string;
  description: string;
  label: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-200/20 bg-amber-200/10 text-amber-200">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="gold-text text-sm font-semibold">{label}</p>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-white/50">
            {badge}
          </span>
        </div>
        <p className="mt-1 text-xs leading-5 text-white/42">{description}</p>
      </div>
    </div>
  );
}
