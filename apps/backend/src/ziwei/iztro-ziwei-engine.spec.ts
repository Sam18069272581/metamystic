import { describe, expect, it } from "vitest";
import { IztroZiweiEngine } from "./iztro-ziwei-engine";

describe("IztroZiweiEngine", () => {
  it("produces a real twelve-palace astrolabe with source metadata", () => {
    const chart = new IztroZiweiEngine().calculate({
      profileId: "profile-1",
      localDate: "1995-05-20",
      localTime: "10:30",
      gender: "female",
      lateZiHourRule: "nextDay"
    });

    expect(chart.palaces).toHaveLength(12);
    expect(chart.palaces.find((palace) => palace.name === "life")?.majorStars.length).toBeGreaterThan(0);
    expect(chart.metadata).toEqual(expect.objectContaining({ engine: "iztro", engineVersion: "2.5.8" }));
    expect(chart.summary).not.toContain("MVP");
  });
});
