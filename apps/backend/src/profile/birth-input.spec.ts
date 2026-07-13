import { describe, expect, it } from "vitest";
import { resolveBirthInput } from "./birth-input";

describe("resolveBirthInput", () => {
  it("converts a Berlin summer local clock without using the server timezone", () => {
    const result = resolveBirthInput({
      calendarType: "solar",
      localDate: "1995-05-20",
      localTime: "10:30",
      timezone: "Europe/Berlin",
      timePrecision: "exact",
      trueSolarTime: false,
      lateZiHourRule: "sameDay"
    });

    expect(result.birthTime.toISOString()).toBe("1995-05-20T08:30:00.000Z");
  });

  it("converts an Asia/Shanghai local clock", () => {
    const result = resolveBirthInput({
      calendarType: "solar",
      localDate: "1995-05-20",
      localTime: "10:30",
      timezone: "Asia/Shanghai",
      timePrecision: "exact",
      trueSolarTime: false,
      lateZiHourRule: "sameDay"
    });

    expect(result.birthTime.toISOString()).toBe("1995-05-20T02:30:00.000Z");
  });

  it("rejects a nonexistent DST local clock", () => {
    expect(() => resolveBirthInput({
      calendarType: "solar",
      localDate: "2026-03-29",
      localTime: "02:30",
      timezone: "Europe/Berlin",
      timePrecision: "exact",
      trueSolarTime: false,
      lateZiHourRule: "sameDay"
    })).toThrow("does not exist");
  });

  it("rejects an ambiguous DST clock by default and supports explicit earlier or later selection", () => {
    const input = {
      calendarType: "solar" as const,
      localDate: "2026-10-25",
      localTime: "02:30",
      timezone: "Europe/Berlin",
      timePrecision: "exact" as const,
      trueSolarTime: false,
      lateZiHourRule: "sameDay" as const
    };

    expect(() => resolveBirthInput(input)).toThrow("ambiguous");
    expect(resolveBirthInput({ ...input, dstDisambiguation: "earlier" }).birthTime.toISOString())
      .toBe("2026-10-25T00:30:00.000Z");
    expect(resolveBirthInput({ ...input, dstDisambiguation: "later" }).birthTime.toISOString())
      .toBe("2026-10-25T01:30:00.000Z");
  });

  it("records a true-solar correction when location is available", () => {
    const result = resolveBirthInput({
      calendarType: "solar",
      localDate: "1995-05-20",
      localTime: "10:30",
      timezone: "Asia/Shanghai",
      location: { name: "北京", latitude: 39.9042, longitude: 116.4074 },
      timePrecision: "exact",
      trueSolarTime: true,
      lateZiHourRule: "sameDay"
    });

    expect(result.trueSolarCorrectionMinutes).toBeLessThan(0);
    expect(result.trueSolarCorrectionMinutes).toBeGreaterThan(-30);
  });
});
