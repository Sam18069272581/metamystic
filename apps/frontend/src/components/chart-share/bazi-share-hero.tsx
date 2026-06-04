import type { PublicBaziShareDto } from "@metamystic/shared";
import { Sparkles, Star, WandSparkles } from "lucide-react";
import { buildBaziShareSummary } from "./chart-share";

export function BaziShareHero({ chart }: { chart: PublicBaziShareDto }) {
  const summary = buildBaziShareSummary(chart);

  return (
    <section className="relative overflow-hidden rounded-3xl border border-amber-200/20 bg-[#10142a] p-5 shadow-glow">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(216,168,80,0.18),transparent_16rem),radial-gradient(circle_at_82%_18%,rgba(109,75,208,0.32),transparent_18rem)]" />
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-white/38">MetaMystic</p>
            <h1 className="gold-text mt-2 text-3xl font-semibold leading-tight">{summary.title}</h1>
            <p className="mt-2 text-sm text-white/62">{summary.subtitle}</p>
          </div>
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-amber-200/20 bg-amber-200/10 text-amber-100">
            <WandSparkles className="h-6 w-6" />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <MetricCard Icon={Star} label="格局置信" value={summary.confidenceLabel} />
          <MetricCard Icon={Sparkles} label="强弱评分" value={`${summary.strengthScore}`} />
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-black/18 p-3">
          <p className="text-xs text-white/38">主导十神</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {summary.dominantTenGods.map((tenGod) => (
              <span key={tenGod} className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-white/76">
                {tenGod}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-3 rounded-2xl border border-amber-200/12 bg-amber-200/[0.055] p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-white/42">喜用神</p>
            <div className="flex gap-1.5">
              {summary.usefulGodLabels.map((label) => (
                <span key={label} className="rounded-full bg-amber-200/12 px-2 py-0.5 text-xs text-amber-100">
                  {label}
                </span>
              ))}
            </div>
          </div>
          <p className="mt-2 text-sm leading-6 text-white/68">{summary.strategySummary}</p>
        </div>
      </div>
    </section>
  );
}

function MetricCard({
  Icon,
  label,
  value
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
      <div className="flex items-center gap-2 text-xs text-white/42">
        <Icon className="h-3.5 w-3.5 text-amber-100/70" />
        {label}
      </div>
      <p className="gold-text mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
}
