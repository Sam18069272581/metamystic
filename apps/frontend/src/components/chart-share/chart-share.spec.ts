import { describe, expect, it } from "vitest";
import { buildBaziSharePath, buildBaziShareSummary, buildBaziShareUrl } from "./chart-share";

describe("chart share links", () => {
  it("builds a public Bazi share path", () => {
    expect(buildBaziSharePath("chart 1")).toBe("/share/bazi/chart%201");
  });

  it("builds an absolute public Bazi share URL", () => {
    expect(buildBaziShareUrl("https://metamystic.vercel.app", "chart-1")).toBe(
      "https://metamystic.vercel.app/share/bazi/chart-1"
    );
  });

  it("builds a share summary from professional Bazi analysis", () => {
    const summary = buildBaziShareSummary({
      id: "chart-1",
      dayMaster: "乙",
      dayMasterStatus: "weak",
      mainPattern: "杀印相生",
      pillars: {
        year: { stem: "乙", branch: "亥", tenGod: "比肩", hiddenStems: ["壬"], nayin: "山头火" },
        month: { stem: "辛", branch: "巳", tenGod: "七杀", hiddenStems: ["丙"], nayin: "白蜡金" },
        day: { stem: "乙", branch: "卯", tenGod: "日主", hiddenStems: ["乙"], nayin: "大溪水" },
        hour: { stem: "辛", branch: "巳", tenGod: "七杀", hiddenStems: ["丙"], nayin: "白蜡金" }
      },
      elements: { wood: 0.2, fire: 0.24, earth: 0.18, metal: 0.28, water: 0.1 },
      usefulGods: ["water", "wood"],
      analysis: {
        strengthScore: 34,
        strengthLabel: "身弱",
        strengthReasons: [],
        favorableStrategy: "先补水木。",
        personality: "",
        career: "",
        wealth: "",
        relationship: "",
        health: "",
        tenGodDistribution: {
          weights: { 七杀: 2, 比肩: 1, 伤官: 1 },
          percentages: { 七杀: 0.5, 比肩: 0.25, 伤官: 0.25 },
          dominantTenGods: ["七杀", "比肩", "伤官"],
          interpretation: ""
        },
        pattern: {
          name: "杀印相生",
          confidence: 0.82,
          evidence: [],
          strategySummary: "先补水木。"
        }
      },
      metadata: {},
      createdAt: "2026-06-04T00:00:00.000Z"
    });

    expect(summary).toEqual({
      title: "杀印相生",
      subtitle: "乙日主 · 身弱",
      confidenceLabel: "82%",
      strengthScore: 34,
      dominantTenGods: ["七杀", "比肩", "伤官"],
      usefulGodLabels: ["水", "木"],
      strategySummary: "先补水木。"
    });
  });
});
