import { describe, expect, it, vi } from "vitest";
import { KnowledgeService } from "./knowledge.service";

describe("KnowledgeService database retrieval", () => {
  it("retrieves three independent candidate channels and returns a retrieval trace", async () => {
    const lexical = [chunk("c1", 0.72)];
    const repository = {
      findTagged: vi.fn().mockResolvedValue([]),
      findLexical: vi.fn().mockResolvedValue(lexical)
    };
    const embeddings = { searchVector: vi.fn().mockResolvedValue([]) };
    const service = new KnowledgeService(embeddings as never, repository as never);

    const result = await service.search("career", 4);

    expect(repository.findLexical).toHaveBeenCalledWith("career", 12);
    expect(repository.findTagged).toHaveBeenCalledWith("career", 12);
    expect(embeddings.searchVector).toHaveBeenCalledWith("career", 12);
    expect(result.retrievalVersion).toBe("hybrid-rrf-v2");
    expect(result.trace.citations).toEqual(["c1"]);
  });
});

function chunk(id: string, score: number) {
  return {
    id,
    sourceTitle: "MetaMystic platform explanation",
    sourceType: "platform_explanation",
    reviewStatus: "published",
    anchorId: id,
    content: "career decision",
    domain: "bazi",
    topic: "career",
    tags: ["career"],
    decisionScenarios: ["career_path"],
    language: "en",
    qualityScore: 0.9,
    score,
    metadata: {}
  };
}
