import type { FiveElement, PublicBaziShareDto } from "@metamystic/shared";

const elementLabels: Record<FiveElement, string> = {
  wood: "木",
  fire: "火",
  earth: "土",
  metal: "金",
  water: "水"
};

export function buildBaziSharePath(chartId: string): string {
  return `/share/bazi/${encodeURIComponent(chartId)}`;
}

export function buildBaziShareUrl(origin: string, chartId: string): string {
  return new URL(buildBaziSharePath(chartId), origin).toString();
}

export interface BaziShareSummary {
  title: string;
  subtitle: string;
  confidenceLabel: string;
  strengthScore: number;
  dominantTenGods: string[];
  usefulGodLabels: string[];
  strategySummary: string;
}

export function buildBaziShareSummary(chart: PublicBaziShareDto): BaziShareSummary {
  const confidence = chart.analysis?.pattern?.confidence ?? 0;
  return {
    title: chart.analysis?.pattern?.name ?? chart.mainPattern,
    subtitle: `${chart.dayMaster}日主 · ${chart.analysis?.strengthLabel ?? statusLabel(chart.dayMasterStatus)}`,
    confidenceLabel: `${Math.round(confidence * 100)}%`,
    strengthScore: chart.analysis?.strengthScore ?? 50,
    dominantTenGods: chart.analysis?.tenGodDistribution?.dominantTenGods ?? [],
    usefulGodLabels: (chart.usefulGods ?? []).map((element) => elementLabels[element]),
    strategySummary: chart.analysis?.pattern?.strategySummary ?? chart.analysis?.favorableStrategy ?? "先看命盘结构，再结合现实问题做决策。"
  };
}

function statusLabel(status: PublicBaziShareDto["dayMasterStatus"]): string {
  return {
    strong: "身强",
    balanced: "中和",
    weak: "身弱"
  }[status];
}
