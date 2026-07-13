"use client";

import { useState } from "react";
import type { BaziChartDto, FiveElement } from "@metamystic/shared";
import { getOrderedBaziPillars, getPillarShensha } from "./bazi-chart-view";
import { buildPillarShenshaInsights, getShenshaToneClass, type ShenshaInsight } from "./bazi-shensha-view";

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
  const [mode, setMode] = useState<"overview" | "professional">("overview");
  const pillars = getOrderedBaziPillars(chart);

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
              {item === "overview" ? "\u5c0f\u767d" : "\u4e13\u4e1a"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
        {chart.metadata?.hourPillarReliable === false ? (
          <p className="border-b border-amber-200/10 bg-amber-200/[0.05] px-3 py-2 text-xs text-amber-100/70">
            {"时辰未知：当前仅展示年月日三柱，时柱不参与旺衰、十神和喜忌分析。"}
          </p>
        ) : null}
        <div className="grid bg-white/[0.04]" style={{ gridTemplateColumns: `repeat(${pillars.length}, minmax(0, 1fr))` }}>
          {pillars.map(([name]) => (
            <div key={name} className="border-r border-white/10 px-2 py-2 text-center text-xs text-white/48 last:border-r-0">
              {pillarLabels[name]}
            </div>
          ))}
        </div>
        <div className="grid" style={{ gridTemplateColumns: `repeat(${pillars.length}, minmax(0, 1fr))` }}>
          {pillars.map(([name, pillar]) => {
            const insights = buildPillarShenshaInsights(getPillarShensha(pillar));
            return (
              <div key={name} className="border-r border-white/10 p-3 text-center last:border-r-0">
                <p className="text-[11px] text-white/40">{pillar.tenGod}</p>
                <p className="mt-2 text-2xl font-semibold text-emerald-300">{pillar.stem}</p>
                <p className="mt-1 text-2xl font-semibold text-rose-300">{pillar.branch}</p>
                <div className="mt-2 flex min-h-12 flex-wrap justify-center gap-1">
                  {insights.length > 0 ? (
                    insights.map((insight) => <ShenshaChip key={`${name}-${insight.label}`} insight={insight} />)
                  ) : (
                    <span className="self-start text-[10px] text-white/28">{"\u672a\u89c1\u4e3b\u795e\u715e"}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {mode === "professional" ? (
          <div className="grid border-t border-white/10 bg-black/10" style={{ gridTemplateColumns: `repeat(${pillars.length}, minmax(0, 1fr))` }}>
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

      {mode === "professional" ? <ShenshaInsightSection pillars={pillars} /> : null}

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
        {mode === "professional" && chart.analysis ? (
          <ProfessionalRuleDetails analysis={chart.analysis} />
        ) : null}
        {mode === "professional" && chart.analysis?.decadeFortunes?.length ? (
          <FortuneTimeline fortunes={chart.analysis.decadeFortunes} />
        ) : null}
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

function ProfessionalRuleDetails({ analysis }: { analysis: NonNullable<BaziChartDto["analysis"]> }) {
  return (
    <div className="border-t border-white/10 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="gold-text text-sm font-semibold">{"规则证据"}</p>
          <p className="mt-1 text-[11px] text-white/38">
            {analysis.ruleVersion ?? "legacy"} · {"置信度 "}{Math.round((analysis.confidence ?? 0) * 100)}%
          </p>
        </div>
        <span className="text-xs text-white/48">{analysis.pattern?.name}</span>
      </div>
      <div className="mt-3 grid gap-2">
        {(analysis.strengthEvidence ?? []).map((item) => (
          <div key={item.dimension} className="grid grid-cols-[56px_1fr_42px] items-center gap-2 text-xs">
            <span className="text-white/48">{strengthDimensionLabel(item.dimension)}</span>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className={item.score < 0 ? "h-full bg-rose-300/70" : "h-full bg-amber-200/70"}
                style={{ width: `${Math.min(100, Math.abs(item.score) / item.maxScore * 100)}%` }}
              />
            </div>
            <span className="text-right text-white/55">{item.score}/{item.maxScore}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {(analysis.usefulGodMethods ?? []).map((method) => (
          <div key={method.method} className="border-l-2 border-amber-200/25 pl-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-amber-100/85">{method.method}</p>
              <span className="text-[11px] text-white/35">{Math.round(method.confidence * 100)}%</span>
            </div>
            <p className="mt-1 text-xs leading-5 text-white/55">
              {"喜 "}{method.favorable.map((element) => elementLabels[element]).join("、") || "未定"}
              {method.unfavorable.length ? ` · 忌 ${method.unfavorable.map((element) => elementLabels[element]).join("、")}` : ""}
            </p>
            <p className="mt-1 text-[11px] leading-5 text-white/40">{method.evidence.join(" ")}</p>
            {method.conflictNote ? <p className="mt-1 text-[11px] leading-5 text-amber-100/55">{method.conflictNote}</p> : null}
          </div>
        ))}
      </div>
      {(analysis.relations ?? []).length > 0 ? (
        <div className="mt-4 border-t border-white/8 pt-3">
          <p className="text-xs text-white/45">{"合冲刑害"}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {analysis.relations?.map((relation, index) => (
              <span key={`${relation.pillars.join("-")}-${relation.type}-${index}`} className="rounded-full border border-white/10 px-2 py-1 text-[11px] text-white/58" title={relation.evidence}>
                {relation.branches.join("")} · {relationTypeLabel(relation.type)} {relation.adjustment > 0 ? "+" : ""}{relation.adjustment}
              </span>
            ))}
          </div>
        </div>
      ) : null}
      {analysis.controversy ? <p className="mt-4 text-[11px] leading-5 text-white/35">{analysis.controversy}</p> : null}
    </div>
  );
}

function FortuneTimeline({ fortunes }: { fortunes: NonNullable<NonNullable<BaziChartDto["analysis"]>["decadeFortunes"]> }) {
  return (
    <div className="border-t border-white/10 pt-4">
      <p className="gold-text text-sm font-semibold">{"大运与流年"}</p>
      <div className="mt-3 flex snap-x gap-3 overflow-x-auto pb-2">
        {fortunes.map((fortune) => (
          <div key={`${fortune.name}-${fortune.startYear}`} className="min-w-36 snap-start border-l-2 border-[#6d4bd0]/45 pl-3">
            <p className="text-lg font-semibold text-white/85">{fortune.name}</p>
            <p className="mt-1 text-xs text-white/42">{fortune.startAge}-{fortune.endAge}{" 岁"}</p>
            <p className="text-xs text-white/42">{fortune.startYear}-{fortune.endYear}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {fortune.annualFortunes.slice(0, 10).map((annual) => (
                <span key={`${fortune.name}-${annual.year}`} className="text-[10px] text-amber-100/55" title={`${annual.age}岁`}>
                  {annual.year}{annual.name}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function strengthDimensionLabel(dimension: NonNullable<NonNullable<BaziChartDto["analysis"]>["strengthEvidence"]>[number]["dimension"]): string {
  return { season: "得令", roots: "得地", momentum: "得势", relations: "合冲" }[dimension];
}

function relationTypeLabel(type: NonNullable<NonNullable<BaziChartDto["analysis"]>["relations"]>[number]["type"]): string {
  return { combine: "合", clash: "冲", punishment: "刑", harm: "害" }[type];
}

function ShenshaChip({ insight }: { insight: ShenshaInsight }) {
  return (
    <span
      className={`rounded-full border px-1.5 py-0.5 text-[10px] ${getShenshaToneClass(insight.tone)}`}
      title={`${insight.category}：${insight.summary}`}
    >
      {insight.label}
    </span>
  );
}

function ShenshaInsightSection({ pillars }: { pillars: ReturnType<typeof getOrderedBaziPillars> }) {
  const rows = pillars
    .map(([name, pillar]) => ({
      name,
      label: pillarLabels[name],
      insights: buildPillarShenshaInsights(getPillarShensha(pillar))
    }))
    .filter((row) => row.insights.length > 0);

  if (rows.length === 0) {
    return null;
  }

  return (
    <section className="mt-4 rounded-2xl border border-white/8 bg-white/[0.025] p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="gold-text text-sm font-semibold">{"\u795e\u715e\u89e3\u8bfb"}</p>
        <p className="text-[11px] text-white/35">{"\u4ee5\u5e38\u7528\u67e5\u6cd5\u4e3a\u53c2\u8003"}</p>
      </div>
      <div className="mt-3 grid gap-2">
        {rows.map((row) => (
          <div key={row.name} className="grid gap-2 rounded-xl border border-white/8 bg-black/10 p-2">
            <p className="text-xs text-white/45">{row.label}</p>
            <div className="grid gap-2">
              {row.insights.map((insight) => (
                <div key={`${row.name}-${insight.label}`} className="grid grid-cols-[auto_1fr] gap-2 text-xs leading-5">
                  <span className={`h-fit rounded-full border px-2 py-0.5 ${getShenshaToneClass(insight.tone)}`}>
                    {insight.category}
                  </span>
                  <p className="text-white/65">
                    <span className="text-white/82">{insight.label}</span>
                    {"："}
                    {insight.summary}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
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
