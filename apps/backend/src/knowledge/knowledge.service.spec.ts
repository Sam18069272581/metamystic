import { describe, expect, it, vi } from "vitest";
import { KnowledgeService } from "./knowledge.service";

describe("KnowledgeService database retrieval", () => {
  it("retrieves candidates in PostgreSQL instead of loading an arbitrary first page", async () => {
    const lexical = [{ id: "c1", sourceTitle: "平台整理", anchorId: "career", content: "事业", metadata: {}, score: 1 }];
    const repository = { findLexical: vi.fn().mockResolvedValue(lexical) };
    const embeddings = { rank: vi.fn().mockResolvedValue(lexical) };
    const service = new KnowledgeService(embeddings as never, repository as never);

    const result = await service.search("事业", 4);

    expect(repository.findLexical).toHaveBeenCalledWith("事业", 12);
    expect(result.chunks).toEqual(lexical);
  });
});
