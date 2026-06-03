"use client";

import { useState } from "react";
import type { BaziChartDto, BaziPillarDto, FiveElement } from "@metamystic/shared";

const elementLabels: Record<FiveElement, string> = {
  wood: "\u6728",
  fire: "\u706b",
  earth: "\u571f",
  metal: "\u91d1",
  water: "\u6c34"
};

const elementColors: Record<FiveElement, string> = {
  wood: "bg-[#5fc9a4]",
  fire: "bg-[#c86f8f]",
  earth: "bg-[#d8a850]",
  metal: "bg-white/70",
  water: "bg-[#6d8cff]"
};

const pillarLabels: Record<keyof BaziChartDto["pillars"], string> = {
  year: "\u5e74\u67f1",
  month: "\u6708\u67f1",
  day: "\u65e5\u67f1",
  hour: "\u65f6\u67f1"
};

export function BaziChartCard({ chart }: { chart: BaziChartDto }) {
  const [mode, setMode] = useState<"overview" | "professional">("professional");
  const pillars = Object.entries(chart.pillars) as Array<[keyof BaziChartDto["pillars"], BaziPillarDto]>;

  return (
    <section className="mystic-card rounded-3xl p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-white/45">{"\u516b\u5b57\u6392\u76d8"}</p>
          <h2 className="gold-text mt-1 text-xl font-semibold">{chart.mainPattern}</h2>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 p-1 text-xs">
          {(["overview", "professional"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setMode(item)}
              className={`rounded-full px-3 py-1 ${mode === item ? "bg-[#d8a850]/25 text-[#f2cf8d]" : "text-white/45"}`}
            >
              {item === "overview" ? "\u6982\u89c8" : "\u4e13\u4e1a"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
        <div className="grid grid-cols-4 bg-white/[0.04]">
          {pillars.map(([name]) => (
            <div key={name} className="border-r border-white/10 px-2 py-2 text-center text-xs text-white/48 last:border-r-0">
              {pillarLabels[name]}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-4">
          {pillars.map(([name, pillar]) => (
            <div key={name} className="border-r border-white/10 p-3 text-center last:border-r-0">
              <p className="text-[11px] text-white/40">{pillar.tenGod}</p>
              <p className="mt-2 text-2xl font-semibold text-emerald-300">{pillar.stem}</p>
              <p className="mt-1 text-2xl font-semibold text-rose-300">{pillar.branch}</p>
              <p className="mt-2 text-[11px] text-white/42">{pillar.nayin}</p>
            </div>
          ))}
        </div>
        {mode === "professional" ? (
          <div className="grid grid-cols-4 border-t border-white/10 bg-black/10">
            {pillars.map(([name, pillar]) => (
              <div key={name} className="min-h-24 border-r border-white/10 p-2 last:border-r-0">
                <p className="mb-2 text-center text-[10px] text-white/35">{"\u85cf\u5e72 / \u5341\u795e"}</p>
                <div className="space-y-1">
                  {(pillar.hiddenStemDetails ?? pillar.hiddenStems.map((stem) => ({ stem, tenGod: "-", element: "earth" as FiveElement }))).map(
                    (hidden) => (
                      <div key={`${name}-${hidden.stem}-${hidden.tenGod}`} className="rounded-lg bg-white/[0.04] px-2 py-1 text-center">
                        <span className="text-xs text-white/80">{hidden.stem}</span>
                        <span className="ml-1 text-[10px] text-amber-100/60">{hidden.tenGod}</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3">
        {chart.analysis ? (
          <div className="rounded-2xl border border-amber-200/12 bg-amber-200/[0.045] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-white/45">{"\u65e5\u4e3b\u5f3a\u5f31"}</p>
                <p className="gold-text mt-1 text-lg font-semibold">{chart.analysis.strengthLabel}</p>
              </div>
              <div className="h-14 w-14 rounded-full border border-amber-100/20 bg-black/20 p-1">
                <div className="flex h-full w-full items-center justify-center rounded-full bg-[#d8a850]/15 text-sm font-semibold text-amber-100">
                  {chart.analysis.strengthScore}
                </div>
              </div>
            </div>
            <div className="mt-3 space-y-2">
              {chart.analysis.strengthReasons.map((reason) => (
                <p key={reason} className="rounded-xl bg-white/[0.035] px-3 py-2 text-xs leading-5 text-white/58">
                  {reason}
                </p>
              ))}
            </div>
            <p className="mt-3 text-sm leading-6 text-white/72">{chart.analysis.favorableStrategy}</p>
          </div>
        ) : null}

        <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/60">{"\u65e5\u4e3b"}</span>
            <span className="gold-text font-semibold">
              {chart.dayMaster} · {statusLabel(chart.dayMasterStatus)}
            </span>
          </div>
          <div className="mt-4 space-y-2">
            {(Object.entries(chart.elements) as Array<[FiveElement, number]>).map(([element, value]) => (
              <div key={element} className="grid grid-cols-[32px_1fr_44px] items-center gap-3 text-xs">
                <span className="text-white/55">{elementLabels[element]}</span>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div className={`h-full ${elementColors[element]}`} style={{ width: `${Math.round(value * 100)}%` }} />
                </div>
                <span className="text-right text-white/45">{Math.round(value * 100)}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <GodPanel label={"\u559c\u7528\u795e"} elements={chart.usefulGods ?? []} tone="good" />
          <GodPanel label={"\u5fcc\u795e"} elements={chart.unfavorableGods ?? []} tone="bad" />
        </div>
        {chart.analysis ? (
          <div className="grid grid-cols-1 gap-2">
            <AnalysisRow label={"\u6027\u683c\u5e95\u8272"} content={chart.analysis.personality} />
            <AnalysisRow label={"\u4e8b\u4e1a\u8def\u5f84"} content={chart.analysis.career} />
            <AnalysisRow label={"\u8d22\u52a1\u7b56\u7565"} content={chart.analysis.wealth} />
            <AnalysisRow label={"\u5173\u7cfb\u6a21\u5f0f"} content={chart.analysis.relationship} />
            <AnalysisRow label={"\u8eab\u5fc3\u63d0\u9192"} content={chart.analysis.health} />
          </div>
        ) : null}
      </div>
    </section>
  );
}

function AnalysisRow({ content, label }: { content: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-3">
      <p className="text-xs text-amber-100/60">{label}</p>
      <p className="mt-2 text-sm leading-6 text-white/72">{content}</p>
    </div>
  );
}

function GodPanel({ elements, label, tone }: { elements: FiveElement[]; label: string; tone: "good" | "bad" }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-3">
      <p className="text-xs text-white/45">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {elements.length > 0 ? (
          elements.map((element) => (
            <span
              key={element}
              className={`rounded-full px-2 py-1 text-xs ${
                tone === "good" ? "bg-amber-200/12 text-amber-100" : "bg-rose-300/10 text-rose-100"
              }`}
            >
              {elementLabels[element]}
            </span>
          ))
        ) : (
          <span className="text-xs text-white/35">{"\u5f85\u5206\u6790"}</span>
        )}
      </div>
    </div>
  );
}

function statusLabel(status: BaziChartDto["dayMasterStatus"]): string {
  return {
    strong: "\u8eab\u5f3a",
    balanced: "\u4e2d\u548c",
    weak: "\u8eab\u5f31"
  }[status];
}
