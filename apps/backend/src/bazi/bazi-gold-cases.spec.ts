import { describe, expect, it } from "vitest";
import { resolveBirthInput } from "../profile/birth-input";
import { TymeBaziEngine } from "./bazi-engine";

describe("Bazi gold cases", () => {
  const engine = new TymeBaziEngine();

  it("matches fixed four pillars for the same Shanghai and Berlin local clock", () => {
    const shanghai = chart("1995-05-20T02:30:00.000Z", "Asia/Shanghai");
    const berlin = chart("1995-05-20T08:30:00.000Z", "Europe/Berlin");
    const names = (value: ReturnType<typeof chart>) => [
      value.pillars.year,
      value.pillars.month,
      value.pillars.day,
      value.pillars.hour,
    ].map((pillar) => `${pillar.stem}${pillar.branch}`);

    expect(names(shanghai)).toEqual(["乙亥", "辛巳", "辛亥", "癸巳"]);
    expect(names(berlin)).toEqual(names(shanghai));
    expect([
      shanghai.pillars.year.tenGod,
      shanghai.pillars.month.tenGod,
      shanghai.pillars.day.tenGod,
      shanghai.pillars.hour.tenGod,
    ]).toEqual(["七杀", "比肩", "比肩", "偏印"]);
    expect(shanghai.pillars.year.hiddenStems).toEqual(["壬", "甲"]);
    expect(shanghai.pillars.month.hiddenStems).toEqual(["丙", "庚", "戊"]);
  });

  it("switches year and month pillars across the 2026 Start-of-Spring minute", () => {
    const before = chart("2026-02-03T20:02:00.000Z", "Asia/Shanghai");
    const after = chart("2026-02-03T20:03:00.000Z", "Asia/Shanghai");

    expect(`${before.pillars.year.stem}${before.pillars.year.branch}`).toBe("乙巳");
    expect(`${before.pillars.month.stem}${before.pillars.month.branch}`).toBe("己丑");
    expect(`${after.pillars.year.stem}${after.pillars.year.branch}`).toBe("丙午");
    expect(`${after.pillars.month.stem}${after.pillars.month.branch}`).toBe("庚寅");
  });

  it("applies true-solar correction across midnight before calculating pillars", () => {
    const corrected = engine.calculate({
      profileId: "corrected",
      birthTime: new Date("1995-05-19T17:00:00.000Z"),
      birthTimezone: "Asia/Shanghai",
      gender: "female",
      trueSolarCorrectionMinutes: -180,
      lateZiHourRule: "sameDay",
    });
    const expectedLocal = engine.calculate({
      profileId: "expected",
      birthTime: new Date("1995-05-19T14:00:00.000Z"),
      birthTimezone: "Asia/Shanghai",
      gender: "female",
      lateZiHourRule: "sameDay",
    });

    expect(corrected.pillars).toEqual(expectedLocal.pillars);
  });

  it("converts a leap lunar month to its fixed solar instant", () => {
    const resolved = resolveBirthInput({
      calendarType: "lunar",
      lunarLeapMonth: true,
      localDate: "2025-06-01",
      localTime: "10:30",
      timezone: "Asia/Shanghai",
      timePrecision: "exact",
      trueSolarTime: false,
      lateZiHourRule: "sameDay",
      dstDisambiguation: "reject",
    });

    expect(resolved.localDate).toBe("2025-07-25");
    expect(resolved.birthTime.toISOString()).toBe("2025-07-25T02:30:00.000Z");
  });

  function chart(instant: string, timezone: string) {
    return engine.calculate({
      profileId: `${timezone}-${instant}`,
      birthTime: new Date(instant),
      birthTimezone: timezone,
      gender: "female",
      lateZiHourRule: "sameDay",
    });
  }
});
