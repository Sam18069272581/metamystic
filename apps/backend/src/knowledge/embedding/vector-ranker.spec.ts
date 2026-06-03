import { describe, expect, it } from "vitest";
import { rankByVectorSimilarity } from "./vector-ranker";

describe("rankByVectorSimilarity", () => {
  it("prioritizes chunks with the highest cosine similarity", () => {
    const ranked = rankByVectorSimilarity(
      [1, 0, 0],
      [
        {
          id: "far",
          sourceTitle: "MVP",
          anchorId: "weak",
          content: "日主偏弱时先补资源。",
          metadata: {},
          embedding: [0, 1, 0]
        },
        {
          id: "near",
          sourceTitle: "MVP",
          anchorId: "shayin",
          content: "杀印相生适合专业路线。",
          metadata: {},
          embedding: [0.9, 0.1, 0]
        }
      ],
      2
    );

    expect(ranked[0]?.id).toBe("near");
    expect(ranked[0]?.score).toBeGreaterThan(ranked[1]?.score ?? 0);
  });
});
