import {
  buildShenshaInsights,
  getShenshaInsight,
  type ShenshaInsight,
  type ShenshaTone
} from "@metamystic/shared/shensha-insights";

export { getShenshaInsight, type ShenshaInsight, type ShenshaTone };

export function buildPillarShenshaInsights(labels: string[] | undefined): ShenshaInsight[] {
  return buildShenshaInsights(labels);
}

export function getShenshaToneClass(tone: ShenshaTone): string {
  return {
    supportive: "border-emerald-200/20 bg-emerald-200/10 text-emerald-100",
    mixed: "border-amber-200/20 bg-amber-200/10 text-amber-100",
    caution: "border-rose-200/20 bg-rose-300/10 text-rose-100"
  }[tone];
}
