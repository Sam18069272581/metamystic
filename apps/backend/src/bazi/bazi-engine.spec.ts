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
    expect(nextDay.metadata.lateZiHourApplied).toBe(true);
  });
});
