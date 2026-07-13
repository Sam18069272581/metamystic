import { describe, expect, it } from "vitest";
import { knowledgeEvaluationCases } from "./knowledge-evaluation-cases";
import { evaluateKnowledgeRetrieval } from "./knowledge-evaluation";
import { knowledgeSeed } from "./knowledge-seed";

describe("knowledge retrieval evaluation set", () => {
  it("keeps Hit@3 at 85% and MRR at 0.75 or better across 30 questions", () => {
    expect(knowledgeEvaluationCases).toHaveLength(30);

    const metrics = evaluateKnowledgeRetrieval(knowledgeEvaluationCases, rankSeedCorpus);

    expect(metrics.hitAt3).toBeGreaterThanOrEqual(0.85);
    expect(metrics.mrr).toBeGreaterThanOrEqual(0.75);
  });
});

function rankSeedCorpus(query: string): string[] {
  const queryBigrams = bigrams(query.toLowerCase());
  return knowledgeSeed
    .flatMap((source) => source.chunks)
    .map((chunk) => {
      const exactTagScore = chunk.tags.filter((tag) => query.includes(tag)).length * 3;
      const overlap = queryBigrams.filter((gram) => chunk.searchText.includes(gram)).length;
      return { anchorId: chunk.anchorId, score: exactTagScore + overlap / Math.max(queryBigrams.length, 1) };
    })
    .sort((left, right) => right.score - left.score || left.anchorId.localeCompare(right.anchorId))
    .map((item) => item.anchorId);
}

function bigrams(value: string): string[] {
  const compact = value.replace(/\s+/g, "");
  return Array.from({ length: Math.max(0, compact.length - 1) }, (_, index) => compact.slice(index, index + 2));
}
