import { describe, expect, it } from "vitest";
import { mergeKnowledgeRankings } from "./knowledge-hybrid-ranker";

describe("mergeKnowledgeRankings", () => {
  it("merges independent tag, lexical and vector rankings with weighted RRF", () => {
    const result = mergeKnowledgeRankings({
      tagged: [chunk("tagged", 1), chunk("shared", 0.8)],
      lexical: [chunk("shared", 0.72), chunk("lexical", 0.6)],
      vector: [chunk("vector", 0.91), chunk("shared", 0.84)]
    }, 4);

    expect(result.chunks.map((item) => item.id)).toEqual(["shared", "vector", "lexical", "tagged"]);
    expect(result.trace.citations).toEqual(result.chunks.map((item) => item.id));
    expect(result.trace.retrievalVersion).toBe("hybrid-rrf-v2");
  });

  it("drops candidates without an exact tag, lexical 0.18, or vector 0.62 signal", () => {
    const result = mergeKnowledgeRankings({
      tagged: [],
      lexical: [chunk("weak-lexical", 0.179)],
      vector: [chunk("weak-vector", 0.619)]
    }, 4);

    expect(result.chunks).toEqual([]);
    expect(result.trace.candidates).toEqual([]);
  });
});

function chunk(id: string, score: number) {
  return {
    id,
    sourceTitle: "MetaMystic platform explanation",
    sourceType: "platform_explanation",
    reviewStatus: "published" as const,
    anchorId: id,
    content: id,
    domain: "bazi",
    topic: "career",
    tags: [id],
    decisionScenarios: ["career_path"],
    language: "zh",
    qualityScore: 0.9,
    score,
    metadata: {}
  };
}
