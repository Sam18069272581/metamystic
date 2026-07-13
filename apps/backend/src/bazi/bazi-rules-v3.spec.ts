import { describe, expect, it } from "vitest";
import { analyzeBaziRulesV3 } from "./bazi-rules-v3";

describe("analyzeBaziRulesV3", () => {
  it("scores strength from season, roots and momentum instead of element percentages", () => {
    const result = analyzeBaziRulesV3({
      dayMaster: "乙",
      pillars: weakChartPillars(),
      hourPillarReliable: true
    });

    expect(result.ruleVersion).toBe("bazi-rules-3.0.0");
    expect(result.strength.level).toBe("weak");
    expect(result.strength.evidence.map((item) => item.dimension)).toEqual(["season", "roots", "momentum", "relations"]);
    expect(result.strength.score).toBeGreaterThanOrEqual(0);
    expect(result.strength.score).toBeLessThan(42);
    expect(result.pattern.name).toBe("格局未定");
    expect(result.pattern.evidence.join(" ")).toContain("月令主气");
    expect(result.usefulGodMethods.map((item) => item.method)).toEqual(["扶抑", "调候", "格局", "通关"]);
    expect(result.relations.some((item) => item.type === "clash")).toBe(true);
  });

  it("recognizes a strongly rooted chart and an exposed month-command pattern", () => {
    const result = analyzeBaziRulesV3({
      dayMaster: "甲",
      pillars: {
        year: pillar("壬", "亥", ["壬", "甲"]),
        month: pillar("甲", "寅", ["甲", "丙", "戊"]),
        day: pillar("甲", "卯", ["乙"]),
        hour: pillar("甲", "寅", ["甲", "丙", "戊"])
      },
      hourPillarReliable: true
    });

    expect(result.strength.level).toMatch(/strong|veryStrong/);
    expect(result.pattern.name).toBe("建禄格");
    expect(result.pattern.confidence).toBeGreaterThanOrEqual(0.75);
  });

  it("renormalizes unknown-hour evidence and lowers confidence", () => {
    const exact = analyzeBaziRulesV3({ dayMaster: "乙", pillars: weakChartPillars(), hourPillarReliable: true });
    const unknown = analyzeBaziRulesV3({ dayMaster: "乙", pillars: weakChartPillars(), hourPillarReliable: false });

    expect(unknown.strength.usedPillars).toBe(3);
    expect(unknown.strength.confidence).toBeLessThan(exact.strength.confidence);
    expect(unknown.strength.evidence.find((item) => item.dimension === "roots")?.maxScore).toBe(30);
  });
});

function weakChartPillars() {
  return {
    year: pillar("乙", "亥", ["壬", "甲"]),
    month: pillar("辛", "巳", ["丙", "戊", "庚"]),
    day: pillar("乙", "卯", ["乙"]),
    hour: pillar("辛", "巳", ["丙", "戊", "庚"])
  };
}

function pillar(stem: string, branch: string, hiddenStems: string[]) {
  return { stem, branch, tenGod: "", hiddenStems };
}
