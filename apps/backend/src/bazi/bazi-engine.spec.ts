import { describe, expect, it } from "vitest";
import { MvpBaziEngine } from "./bazi-engine";

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
