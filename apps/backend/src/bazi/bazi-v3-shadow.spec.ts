import { describe, expect, it } from "vitest";
import { TymeBaziEngine } from "./bazi-engine";
import { enrichProfessionalBaziChart } from "./professional-bazi";

describe("Bazi V3 shadow comparison", () => {
  it("preserves calendar facts across 100 deterministic charts", () => {
    const engine = new TymeBaziEngine();
    const base = Date.UTC(1970, 0, 15, 0, 30);

    for (let index = 0; index < 100; index += 1) {
      const raw = engine.calculate({
        profileId: `shadow-${index}`,
        birthTime: new Date(base + index * 137 * 24 * 60 * 60 * 1_000),
        birthTimezone: "Asia/Shanghai",
        gender: index % 2 === 0 ? "female" : "male",
        lateZiHourRule: index % 2 === 0 ? "sameDay" : "nextDay",
      });
      const enriched = enrichProfessionalBaziChart(raw);

      expect(calendarFacts(enriched.pillars)).toEqual(calendarFacts(raw.pillars));
      expect(enriched.analysis?.ruleVersion).toBe("bazi-rules-3.0.0");
      expect(enriched.analysis?.strengthEvidence?.length ?? 0).toBeGreaterThanOrEqual(3);
      expect(enriched.analysis?.usefulGodMethods).toHaveLength(4);
      expect(enriched.analysis?.confidence).toBeGreaterThan(0);
    }
  });
});

function calendarFacts(pillars: ReturnType<TymeBaziEngine["calculate"]>["pillars"]) {
  return Object.values(pillars).map((pillar) => ({
    stem: pillar.stem,
    branch: pillar.branch,
    tenGod: pillar.tenGod,
    hiddenStems: pillar.hiddenStems,
  }));
}
