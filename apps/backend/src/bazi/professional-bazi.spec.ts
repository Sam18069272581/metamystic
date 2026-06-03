import { describe, expect, it } from "vitest";
import { enrichProfessionalBaziChart } from "./professional-bazi";

describe("enrichProfessionalBaziChart", () => {
  it("adds hidden stem ten gods and useful gods for professional display", () => {
    const chart = enrichProfessionalBaziChart({
      profileId: "profile-1",
      dayMaster: "\u4e59",
      dayMasterStatus: "weak",
      mainPattern: "\u6740\u5370\u76f8\u751f",
      pillars: {
        year: { stem: "\u4e59", branch: "\u4ea5", tenGod: "\u6bd4\u80a9", hiddenStems: ["\u58ec", "\u7532"], nayin: "\u5c71\u5934\u706b" },
        month: { stem: "\u8f9b", branch: "\u5df3", tenGod: "\u4e03\u6740", hiddenStems: ["\u4e19", "\u620a", "\u5e9a"], nayin: "\u767d\u8721\u91d1" },
        day: { stem: "\u4e59", branch: "\u536f", tenGod: "\u65e5\u4e3b", hiddenStems: ["\u4e59"], nayin: "\u5927\u6eaa\u6c34" },
        hour: { stem: "\u8f9b", branch: "\u5df3", tenGod: "\u4e03\u6740", hiddenStems: ["\u4e19", "\u620a", "\u5e9a"], nayin: "\u767d\u8721\u91d1" }
      },
      elements: { wood: 0.2, fire: 0.24, earth: 0.18, metal: 0.28, water: 0.1 },
      metadata: {}
    });

    expect(chart.pillars.month.hiddenStemDetails?.map((item) => item.tenGod)).toEqual([
      "\u4f24\u5b98",
      "\u6b63\u8d22",
      "\u6b63\u5b98"
    ]);
    expect(chart.usefulGods).toEqual(["water", "wood"]);
    expect(chart.unfavorableGods).toContain("metal");
    expect(chart.analysis?.strengthLabel).toBe("\u8eab\u5f31");
    expect(chart.analysis?.strengthReasons).toContain("\u6708\u4ee4\u5bf9\u65e5\u4e3b\u4e3a\u6cc4\u8017\u6216\u514b\u5236\uff0c\u65e5\u4e3b\u9700\u8981\u5370\u6bd4\u627f\u6258\u3002");
    expect(chart.analysis?.career).toContain("\u5148\u5efa\u7acb\u4e13\u4e1a\u4fe1\u4efb");
    expect(chart.analysis?.strength).toEqual(
      expect.objectContaining({
        level: "\u504f\u5f31",
        seasonalSupport: "draining",
        supportScore: expect.any(Number),
        pressureScore: expect.any(Number)
      })
    );
    expect(chart.analysis?.tenGodDistribution).toEqual(
      expect.objectContaining({
        dominantTenGods: ["\u4e03\u6740", "\u6bd4\u80a9", "\u4f24\u5b98"]
      })
    );
    expect(chart.analysis?.tenGodDistribution?.weights["\u4e03\u6740"]).toBeGreaterThan(0);
    expect(chart.analysis?.tenGodDistribution?.weights["\u6b63\u5b98"]).toBeGreaterThan(0);
    expect(chart.analysis?.usefulGodDetails?.[0]).toEqual(
      expect.objectContaining({
        element: "water",
        label: "\u6c34",
        role: "\u559c\u795e"
      })
    );
    expect(chart.analysis?.pattern).toEqual(
      expect.objectContaining({
        name: "\u6740\u5370\u76f8\u751f",
        confidence: expect.any(Number)
      })
    );
    expect(chart.analysis?.riskFlags).toContain("\u5b98\u6740\u538b\u529b\u504f\u91cd");
  });
});
