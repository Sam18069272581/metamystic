import { describe, expect, it } from "vitest";
import { rankKnowledgeChunks } from "./knowledge-ranker";

describe("rankKnowledgeChunks", () => {
  it("prioritizes exact metaphysics terms over loose question words", () => {
    const ranked = rankKnowledgeChunks(
      "我适合去德国发展吗？杀印相生 专业",
      [
        {
          id: "general",
          sourceTitle: "MVP",
          anchorId: "decision",
          content: "命理分析适合作为决策辅助。",
          metadata: { tags: ["决策"] }
        },
        {
          id: "pattern",
          sourceTitle: "MVP",
          anchorId: "pattern-shayin",
          content: "杀印相生强调压力与学习系统之间的转化，适合技术、学历、跨境与专业路线。",
          metadata: { tags: ["格局", "杀印相生", "专业"] }
        }
      ],
      2
    );

    expect(ranked[0]?.id).toBe("pattern");
    expect(ranked[0]?.score).toBeGreaterThan(ranked[1]?.score ?? 0);
  });

  it("returns an empty list when no meaningful token matches", () => {
    const ranked = rankKnowledgeChunks(
      "完全无关的问题",
      [
        {
          id: "pattern",
          sourceTitle: "MVP",
          anchorId: "pattern-shayin",
          content: "杀印相生强调压力与学习系统之间的转化。",
          metadata: { tags: ["格局"] }
        }
      ],
      3
    );

    expect(ranked).toEqual([]);
  });
});
