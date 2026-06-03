import { describe, expect, it, vi } from "vitest";
import { KnowledgeEmbeddingBackfillService } from "./knowledge-embedding-backfill.service";

describe("KnowledgeEmbeddingBackfillService", () => {
  it("embeds missing knowledge chunks and persists vectors", async () => {
    const repository = {
      findChunksMissingEmbeddings: vi.fn().mockResolvedValue([
        {
          id: "chunk-1",
          sourceTitle: "MVP",
          anchorId: "pattern-shayin",
          content: "杀印相生适合专业路线。",
          metadata: { tags: ["杀印相生"] }
        }
      ]),
      updateEmbedding: vi.fn().mockResolvedValue(undefined)
    };
    const embeddings = {
      embedKnowledgeChunk: vi.fn().mockResolvedValue([1, 0, 0])
    };
    const service = new KnowledgeEmbeddingBackfillService(repository as never, embeddings as never);

    const result = await service.backfillMissingEmbeddings(20);

    expect(repository.findChunksMissingEmbeddings).toHaveBeenCalledWith(20);
    expect(embeddings.embedKnowledgeChunk).toHaveBeenCalledWith({
      id: "chunk-1",
      sourceTitle: "MVP",
      anchorId: "pattern-shayin",
      content: "杀印相生适合专业路线。",
      metadata: { tags: ["杀印相生"] }
    });
    expect(repository.updateEmbedding).toHaveBeenCalledWith("chunk-1", [1, 0, 0]);
    expect(result).toEqual({ processed: 1, failed: 0 });
  });

  it("continues backfilling when one chunk fails", async () => {
    const repository = {
      findChunksMissingEmbeddings: vi.fn().mockResolvedValue([
        {
          id: "broken",
          sourceTitle: "MVP",
          anchorId: "broken",
          content: "坏数据。",
          metadata: {}
        },
        {
          id: "ok",
          sourceTitle: "MVP",
          anchorId: "ok",
          content: "可写入数据。",
          metadata: {}
        }
      ]),
      updateEmbedding: vi.fn().mockResolvedValue(undefined)
    };
    const embeddings = {
      embedKnowledgeChunk: vi
        .fn()
        .mockRejectedValueOnce(new Error("provider unavailable"))
        .mockResolvedValueOnce([0, 1, 0])
    };
    const service = new KnowledgeEmbeddingBackfillService(repository as never, embeddings as never);

    const result = await service.backfillMissingEmbeddings(20);

    expect(repository.updateEmbedding).toHaveBeenCalledOnce();
    expect(repository.updateEmbedding).toHaveBeenCalledWith("ok", [0, 1, 0]);
    expect(result).toEqual({ processed: 1, failed: 1 });
  });
});
