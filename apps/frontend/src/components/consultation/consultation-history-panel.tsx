"use client";

import { History, MessageCircle } from "lucide-react";
import type { ConsultationHistoryDto } from "@metamystic/shared";
import { buildConsultationHistoryView } from "./consultation-history-view";

export function ConsultationHistoryPanel({ history }: { history: ConsultationHistoryDto | undefined }) {
  if (!history) {
    return null;
  }

  const view = buildConsultationHistoryView(history);

  return (
    <section className="mystic-card rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-200/20 bg-violet-200/10 text-violet-100">
          <History className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="gold-text text-sm font-semibold">{"\u54a8\u8be2\u8bb0\u5f55"}</p>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/55">
              {view.statusLabel}
            </span>
          </div>
          <p className="mt-1 text-xs leading-5 text-white/42">
            {`\u5df2\u5199\u5165 ${view.messageCount} \u6761\u5bf9\u8bdd\u6d88\u606f`}
          </p>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        <HistoryItem label={"\u4f60\u7684\u95ee\u9898"} content={view.latestQuestion} />
        {view.assistantPreview ? <HistoryItem label={"\u6700\u8fd1 AI \u56de\u590d"} content={view.assistantPreview} /> : null}
      </div>
    </section>
  );
}

function HistoryItem({ content, label }: { content: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-3">
      <div className="flex items-center gap-2 text-xs text-white/48">
        <MessageCircle className="h-3.5 w-3.5 text-amber-100/70" />
        <span>{label}</span>
      </div>
      <p className="mt-2 text-sm leading-6 text-white/74">{content}</p>
    </div>
  );
}
