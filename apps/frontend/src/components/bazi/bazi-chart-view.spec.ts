import { describe, expect, it } from "vitest";
import type { BaziChartDto } from "@metamystic/shared";
import { getOrderedBaziPillars, getPillarShensha } from "./bazi-chart-view";

describe("bazi chart view helpers", () => {
  it("orders pillars by year, month, day, and hour regardless of object insertion order", () => {
    const chart = {
      pillars: {
        hour: { stem: "辛", branch: "巳", tenGod: "七杀", hiddenStems: [], shensha: ["天德贵人"] },
        day: { stem: "乙", branch: "卯", tenGod: "日主", hiddenStems: [], shensha: ["将星"] },
        year: { stem: "乙", branch: "亥", tenGod: "比肩", hiddenStems: [], shensha: [] },
        month: { stem: "辛", branch: "巳", tenGod: "七杀", hiddenStems: [], shensha: ["驿马"] }
      }
    } as unknown as BaziChartDto;

    expect(getOrderedBaziPillars(chart).map(([name]) => name)).toEqual(["year", "month", "day", "hour"]);
  });

  it("uses shensha as the display metadata instead of nayin", () => {
    expect(getPillarShensha({ stem: "乙", branch: "卯", tenGod: "日主", hiddenStems: [], shensha: ["将星"] })).toEqual([
      "将星"
    ]);
    expect(getPillarShensha({ stem: "乙", branch: "亥", tenGod: "比肩", hiddenStems: [], nayin: "山头火" })).toEqual([]);
  });
  it("deduplicates shensha labels and removes blank display values", () => {
    expect(
      getPillarShensha({
        stem: "\u4e59",
        branch: "\u536f",
        tenGod: "\u65e5\u4e3b",
        hiddenStems: [],
        shensha: ["\u5c06\u661f", " ", "\u5c06\u661f", "\u5929\u5fb7\u8d35\u4eba"]
      })
    ).toEqual(["\u5c06\u661f", "\u5929\u5fb7\u8d35\u4eba"]);
  });
});
