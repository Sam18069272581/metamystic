"use client";

import Link from "next/link";
import { Clock3, MessageSquareText } from "lucide-react";
import type { ConsultationDto } from "@metamystic/shared";
import { buildConsultationListItems } from "./consultation-list-view";

export function RecentConsultationsPanel({ consultations }: { consultations: ConsultationDto[] }) {
  const items = buildConsultationListItems(consultations);

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="mystic-card rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-200/20 bg-violet-200/10 text-violet-100">
          <Clock3 className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="gold-text text-sm font-semibold">{"\u6700\u8fd1\u54a8\u8be2"}</p>
          <p className="mt-1 text-xs leading-5 text-white/42">{"\u7528\u4e8e\u4e2a\u4eba\u6863\u6848\u548c\u957f\u671f\u966a\u4f34\u7684\u51b3\u7b56\u8f68\u8ff9"}</p>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        {items.slice(0, 5).map((item) => (
          <Link key={item.id} href={`/me/consultations/${item.id}`} className="block rounded-2xl border border-white/8 bg-white/[0.035] p-3 transition hover:border-amber-200/30">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <MessageSquareText className="h-3.5 w-3.5 shrink-0 text-amber-100/70" />
                <p className="truncate text-sm text-white/78">{item.title}</p>
              </div>
              <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/50">
                {item.statusLabel}
              </span>
            </div>
            <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/48">{item.summary}</p>
            <p className="mt-2 text-[10px] text-amber-100/55">{item.toneLabel}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
