"use client";

import type { ZiweiChartDto, ZiweiPalaceDto } from "@metamystic/shared";

const gridSlots = [0, 1, 2, 3, 11, -1, -1, 4, 10, -1, -1, 5, 9, 8, 7, 6];

export function ZiweiChartBoard({ chart }: { chart: ZiweiChartDto }) {
  return (
    <section className="mystic-card rounded-3xl p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-white/45">{"\u7d2b\u5fae\u6597\u6570"}</p>
          <h2 className="gold-text mt-1 text-xl font-semibold">{"\u5341\u4e8c\u5bab\u76d8"}</h2>
        </div>
        <div className="text-right text-xs text-white/45">
          <p>{`\u547d\u5bab ${labelOf(chart, chart.lifePalace)}`}</p>
          <p className="mt-1">{`\u8eab\u5bab ${labelOf(chart, chart.bodyPalace)}`}</p>
        </div>
      </div>

      <div className="mt-4 grid aspect-square grid-cols-4 grid-rows-4 overflow-hidden rounded-2xl border border-white/10">
        {gridSlots.map((slot, index) =>
          slot < 0 ? (
            <div key={index} className="flex items-center justify-center border border-white/8 bg-white/[0.025] text-center">
              {index === 5 ? <p className="gold-text text-sm font-semibold">{"MetaMystic"}</p> : null}
            </div>
          ) : (
            <PalaceCell key={index} palace={chart.palaces[slot] as ZiweiPalaceDto} active={chart.lifePalace === chart.palaces[slot]?.name} />
          )
        )}
      </div>
      <p className="mt-3 text-xs leading-5 text-white/45">{chart.summary}</p>
      {chart.analysis ? (
        <div className="mt-4 space-y-2">
          <AnalysisItem label={"\u547d\u5bab\u4e3b\u9898"} content={chart.analysis.lifeTheme} />
          <AnalysisItem label={"\u8eab\u5bab\u843d\u70b9"} content={chart.analysis.bodyTheme} />
          <AnalysisItem label={"\u4e8b\u4e1a"} content={chart.analysis.career} />
          <AnalysisItem label={"\u8d22\u5e1b"} content={chart.analysis.wealth} />
          <AnalysisItem label={"\u611f\u60c5"} content={chart.analysis.relationship} />
          <AnalysisItem label={"\u89e3\u8bfb\u63d0\u9192"} content={chart.analysis.advice} />
        </div>
      ) : null}
    </section>
  );
}

function PalaceCell({ active, palace }: { palace: ZiweiPalaceDto; active: boolean }) {
  return (
    <div className={`border border-white/8 p-2 ${active ? "bg-amber-200/10" : "bg-white/[0.035]"}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-white/80">{palace.label}</p>
        <span className="text-[10px] text-amber-100/60">{palace.earthlyBranch}</span>
      </div>
      <p className="mt-2 text-[11px] leading-4 text-violet-100/80">{palace.majorStars.join(" · ")}</p>
      <p className="mt-1 text-[10px] leading-4 text-white/38">{palace.minorStars.join(" ")}</p>
      <p className="mt-2 text-[10px] text-white/32">{palace.ageRange}</p>
    </div>
  );
}

function labelOf(chart: ZiweiChartDto, name: ZiweiChartDto["lifePalace"]): string {
  return chart.palaces.find((palace) => palace.name === name)?.label ?? "-";
}

function AnalysisItem({ content, label }: { content: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-3">
      <p className="text-xs text-amber-100/60">{label}</p>
      <p className="mt-2 text-sm leading-6 text-white/72">{content}</p>
    </div>
  );
}
