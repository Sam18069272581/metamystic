import { describe, expect, it } from "vitest";
import { MvpBaziEngine, TymeBaziEngine } from "./bazi-engine";

describe("MvpBaziEngine", () => {
  it("returns readable Chinese chart labels", () => {
    const chart = new MvpBaziEngine().calculate({
      profileId: "profile-1",
      birthTime: new Date("1995-05-20T10:30:00.000Z"),
      birthTimezone: "Asia/Shanghai",
      gender: "female"
    });

    const text = JSON.stringify(chart);

    expect(text).toMatch(/甲|乙|丙|丁|戊|己|庚|辛|壬|癸/);
    expect(text).not.toMatch(/锛|鐨|鍛|鏉|涓|€/);
  });
});

describe("TymeBaziEngine timezone handling", () => {
  it("calculates from the birth timezone local clock instead of UTC fields", () => {
    const engine = new TymeBaziEngine();
    const berlin = engine.calculate({
      profileId: "berlin",
      birthTime: new Date("1995-05-20T08:30:00.000Z"),
      birthTimezone: "Europe/Berlin",
      gender: "female"
    });
    const sameLocalClockAtUtc = engine.calculate({
      profileId: "utc",
      birthTime: new Date("1995-05-20T10:30:00.000Z"),
      birthTimezone: "UTC",
      gender: "female"
    });

    expect(berlin.pillars).toEqual(sameLocalClockAtUtc.pillars);
    expect(berlin.dayMaster).toBe(sameLocalClockAtUtc.dayMaster);
  });

  it("applies the configured late-Zi day rollover rule", () => {
    const engine = new TymeBaziEngine();
    const sameDay = engine.calculate({
      profileId: "same-day",
      birthTime: new Date("1995-05-20T15:30:00.000Z"),
      birthTimezone: "Asia/Shanghai",
      gender: "female",
      lateZiHourRule: "sameDay"
    });
    const nextDay = engine.calculate({
      profileId: "next-day",
      birthTime: new Date("1995-05-20T15:30:00.000Z"),
      birthTimezone: "Asia/Shanghai",
      gender: "female",
      lateZiHourRule: "nextDay"
    });

    expect(nextDay.pillars.day).not.toEqual(sameDay.pillars.day);
    expect(`${sameDay.pillars.day.stem}${sameDay.pillars.day.branch}`).toBe("辛亥");
    expect(`${nextDay.pillars.day.stem}${nextDay.pillars.day.branch}`).toBe("壬子");
    expect(nextDay.metadata.lateZiHourApplied).toBe(true);
  });

  it("excludes the hour pillar from element weighting when birth time is unknown", () => {
    const engine = new TymeBaziEngine();
    const morning = engine.calculate({
      profileId: "unknown-morning",
      birthTime: new Date("1995-05-20T00:00:00.000Z"),
      birthTimezone: "Asia/Shanghai",
      gender: "female",
      timePrecision: "unknown"
    });
    const evening = engine.calculate({
      profileId: "unknown-evening",
      birthTime: new Date("1995-05-20T12:00:00.000Z"),
      birthTimezone: "Asia/Shanghai",
      gender: "female",
      timePrecision: "unknown"
    });

    expect(morning.elements).toEqual(evening.elements);
    expect(morning.metadata.hourPillarReliable).toBe(false);
  });

  it("builds a traceable decade and annual fortune timeline for binary gender inputs", () => {
    const chart = new TymeBaziEngine().calculate({
      profileId: "timeline",
      birthTime: new Date("1995-05-20T02:30:00.000Z"),
      birthTimezone: "Asia/Shanghai",
      gender: "female"
    });
    const fortunes = chart.metadata.decadeFortunes as Array<{
      name: string;
      startAge: number;
      annualFortunes: unknown[];
    }>;

    expect(fortunes).toHaveLength(8);
    expect(fortunes[0]).toEqual(expect.objectContaining({
      name: expect.stringMatching(/^[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]$/),
      startAge: expect.any(Number),
      annualFortunes: expect.any(Array)
    }));
    expect(fortunes[0]?.annualFortunes).toHaveLength(10);
    expect(chart.metadata.fortuneProvider).toBe("tyme4ts/ChildLimit");
  });
});
