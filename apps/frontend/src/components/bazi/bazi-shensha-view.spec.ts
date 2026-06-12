import { describe, expect, it } from "vitest";
import { buildPillarShenshaInsights, getShenshaInsight } from "./bazi-shensha-view";

describe("bazi shensha view helpers", () => {
  it("maps known shensha labels to user-readable insight metadata", () => {
    expect(getShenshaInsight("天乙贵人")).toEqual({
      label: "天乙贵人",
      category: "贵人",
      tone: "supportive",
      summary: expect.stringContaining("助力")
    });
    expect(getShenshaInsight("桃花")).toEqual({
      label: "桃花",
      category: "关系",
      tone: "mixed",
      summary: expect.stringContaining("吸引力")
    });
    expect(getShenshaInsight("空亡")).toEqual({
      label: "空亡",
      category: "风险",
      tone: "caution",
      summary: expect.stringContaining("落空")
    });
  });

  it("deduplicates labels and falls back gracefully for unknown shensha", () => {
    expect(buildPillarShenshaInsights(["天乙贵人", " ", "天乙贵人", "未知星"])).toEqual([
      {
        label: "天乙贵人",
        category: "贵人",
        tone: "supportive",
        summary: expect.any(String)
      },
      {
        label: "未知星",
        category: "神煞",
        tone: "mixed",
        summary: "当前规则库已识别此神煞名称，详细解释待补充。"
      }
    ]);
  });
});
