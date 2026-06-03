"use client";

import { BrainCircuit, Sparkles } from "lucide-react";
import type { ProfileMemorySignalsDto } from "@metamystic/shared";
import { buildProfileMemoryView } from "./profile-memory-view";

export function ProfileMemoryPanel({ memory }: { memory: ProfileMemorySignalsDto | undefined }) {
  if (!memory || memory.sources.length === 0) {
    return null;
  }

  const view = buildProfileMemoryView(memory);

  return (
    <section className="mystic-card rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-200/20 bg-amber-200/10 text-amber-200">
          <BrainCircuit className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="gold-text text-sm font-semibold">{"AI \u8bb0\u5fc6"}</p>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/55">
              {view.sourceText}
            </span>
          </div>
          <p className="mt-1 text-xs leading-5 text-white/42">
            {"\u4ece\u5df2\u5b8c\u6210\u54a8\u8be2\u4e2d\u6c89\u6dc0\u7684\u957f\u671f\u51b3\u7b56\u504f\u597d"}
          </p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2">
        <MemoryRow label={"\u957f\u671f\u4e3b\u9898"} value={view.topicText} />
        <MemoryRow label={"\u98ce\u9669\u504f\u597d"} value={view.riskStyle} />
        <MemoryRow label={"\u5bf9\u8bdd\u504f\u597d"} value={view.preferredTone} />
      </div>
    </section>
  );
}

function MemoryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.035] px-3 py-2">
      <Sparkles className="h-3.5 w-3.5 shrink-0 text-amber-100/70" />
      <span className="w-20 shrink-0 text-xs text-white/45">{label}</span>
      <span className="min-w-0 flex-1 truncate text-sm text-white/74">{value}</span>
    </div>
  );
}
