import type { BaziChartDto, BaziPillarDto } from "@metamystic/shared";

export const baziPillarOrder = ["year", "month", "day", "hour"] as const;

export type BaziPillarName = (typeof baziPillarOrder)[number];

export function getOrderedBaziPillars(chart: BaziChartDto): Array<[BaziPillarName, BaziPillarDto]> {
  const order = chart.metadata?.hourPillarReliable === false ? baziPillarOrder.slice(0, 3) : baziPillarOrder;
  return order.map((name) => [name, chart.pillars[name]]);
}

export function getPillarShensha(pillar: BaziPillarDto): string[] {
  return Array.from(new Set((pillar.shensha ?? []).map((item) => item.trim()).filter(Boolean)));
}
