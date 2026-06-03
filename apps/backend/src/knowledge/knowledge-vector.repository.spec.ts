import { describe, expect, it, vi } from "vitest";
import { KnowledgeVectorRepository } from "./knowledge-vector.repository";

describe("KnowledgeVectorRepository", () => {
  it("normalizes pgvector rows into knowledge chunks", async () => {
    const prisma = {
      $queryRaw: vi.fn().mockResolvedValue([
        {
          id: "chunk-1",
          sourceTitle: "MVP",
          anchorId: "pattern-shayin",
          content: "杀印相生适合专业路线。",
          metadata: { tags: ["杀印相生"] },
          score: 0.91
        }
      ])
    };
    const repository = new KnowledgeVectorRepository(prisma as never);

    const chunks = await repository.findSimilar([1, 0, 0], 4);

    expect(chunks).toEqual([
      {
        id: "chunk-1",
        sourceTitle: "MVP",
        anchorId: "pattern-shayin",
        content: "杀印相生适合专业路线。",
        metadata: { tags: ["杀印相生"] },
        score: 0.91
      }
    ]);
    expect(prisma.$queryRaw).toHaveBeenCalledOnce();
  });

  it("filters non-positive vector matches", async () => {
    const prisma = {
      $queryRaw: vi.fn().mockResolvedValue([
        {
          id: "near",
          sourceTitle: "MVP",
          anchorId: "near",
          content: "有效命中。",
          metadata: {},
          score: 0.42
        },
        {
          id: "zero",
          sourceTitle: "MVP",
          anchorId: "zero",
          content: "无关内容。",
          metadata: {},
          score: 0
        }
      ])
    };
    const repository = new KnowledgeVectorRepository(prisma as never);

    const chunks = await repository.findSimilar([1, 0, 0], 4);

    expect(chunks.map((chunk) => chunk.id)).toEqual(["near"]);
  });

  it("persists embeddings through a vector cast", async () => {
    const prisma = {
      $executeRaw: vi.fn().mockResolvedValue(1)
    };
    const repository = new KnowledgeVectorRepository(prisma as never);

    await repository.updateEmbedding("chunk-1", [1, 0, 0]);

    expect(prisma.$executeRaw).toHaveBeenCalledOnce();
  });

  it("finds chunks that still need persisted embeddings", async () => {
    const prisma = {
      $queryRaw: vi.fn().mockResolvedValue([
        {
          id: "chunk-1",
          sourceTitle: "MVP",
          anchorId: "pattern-shayin",
          content: "杀印相生适合专业路线。",
          metadata: { tags: ["杀印相生"] }
        }
      ])
    };
    const repository = new KnowledgeVectorRepository(prisma as never);

    const chunks = await repository.findChunksMissingEmbeddings(10);

    expect(chunks).toEqual([
      {
        id: "chunk-1",
        sourceTitle: "MVP",
        anchorId: "pattern-shayin",
        content: "杀印相生适合专业路线。",
        metadata: { tags: ["杀印相生"] }
      }
    ]);
    expect(prisma.$queryRaw).toHaveBeenCalledOnce();
  });
});
