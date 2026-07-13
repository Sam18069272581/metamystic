import { describe, expect, it } from "vitest";
import { buildBirthInputV2 } from "./birth-input";

describe("buildBirthInputV2", () => {
  it("keeps the local clock and declared timezone without browser conversion", () => {
    expect(buildBirthInputV2("1995-05-20T10:30", {
      timezone: "Asia/Shanghai",
      trueSolarTime: true,
      lateZiHourRule: "nextDay",
      dstDisambiguation: "reject"
    })).toEqual(expect.objectContaining({
      localDate: "1995-05-20",
      localTime: "10:30",
      timezone: "Asia/Shanghai",
      trueSolarTime: true,
      lateZiHourRule: "nextDay"
    }));
  });

  it("rejects incomplete local date-time values", () => {
    expect(() => buildBirthInputV2("1995-05-20", { timezone: "UTC" })).toThrow("完整的出生日期和时间");
  });
});
