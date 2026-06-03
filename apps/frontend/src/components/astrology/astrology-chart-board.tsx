import { Compass, Moon, Sparkles, Sun } from "lucide-react";
import type { AstrologyBody, AstrologyChartDto, AstrologyPlacementDto } from "@metamystic/shared";

const bodyIcons: Record<AstrologyBody, typeof Sun> = {
  Sun,
  Moon,
  Ascendant: Compass
};

const elementLabels = {
  wood: "木",
  fire: "火",
  earth: "土",
  metal: "风",
  water: "水"
};

export function AstrologyChartBoard({ chart }: { chart: AstrologyChartDto }) {
  return (
    <section className="mystic-card rounded-3xl p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-white/45">{"西洋占星"}</p>
          <h2 className="gold-text mt-1 text-xl font-semibold">{"本命星盘"}</h2>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-200/20 bg-amber-200/10 text-amber-100">
          <Sparkles className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {chart.placements.map((placement) => (
          <PlacementCard key={placement.body} placement={placement} />
        ))}
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        {chart.houses.map((house) => (
          <div key={house.house} className="rounded-2xl border border-white/8 bg-white/[0.035] p-2">
            <p className="text-[10px] text-white/36">{`${house.house}宫`}</p>
            <p className="mt-1 text-xs font-semibold text-white/78">{house.sign}</p>
            <p className="mt-1 text-[10px] text-amber-100/50">{`${house.cuspDegree}°`}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.035] p-3">
        <p className="text-xs text-white/45">{"元素倾向"}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {Object.entries(chart.dominantElements).map(([element, value]) => (
            <span key={element} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/68">
              {`${elementLabels[element as keyof typeof elementLabels]} ${value}`}
            </span>
          ))}
        </div>
      </div>
      <p className="mt-3 text-xs leading-5 text-white/45">{chart.summary}</p>

      {chart.analysis ? (
        <div className="mt-4 space-y-2">
          <AnalysisItem label={"核心身份"} content={chart.analysis.coreIdentity} />
          <AnalysisItem label={"情绪模式"} content={chart.analysis.emotionalPattern} />
          <AnalysisItem label={"外在气质"} content={chart.analysis.socialMask} />
          <AnalysisItem label={"元素权重"} content={chart.analysis.dominantElement} />
          <AnalysisItem label={"事业"} content={chart.analysis.career} />
          <AnalysisItem label={"关系"} content={chart.analysis.relationship} />
          <AnalysisItem label={"解读提醒"} content={chart.analysis.advice} />
        </div>
      ) : null}
    </section>
  );
}

function PlacementCard({ placement }: { placement: AstrologyPlacementDto }) {
  const Icon = bodyIcons[placement.body];
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-3">
      <div className="flex items-center gap-2 text-amber-100">
        <Icon className="h-4 w-4" />
        <p className="text-xs font-semibold">{placement.label}</p>
      </div>
      <p className="mt-3 text-sm font-semibold text-white/82">{`${placement.sign} ${placement.degree}°`}</p>
      <p className="mt-1 text-[11px] text-white/42">{`${placement.house}宫`}</p>
    </div>
  );
}

function AnalysisItem({ content, label }: { content: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-3">
      <p className="text-xs text-amber-100/60">{label}</p>
      <p className="mt-2 text-sm leading-6 text-white/72">{content}</p>
    </div>
  );
}
