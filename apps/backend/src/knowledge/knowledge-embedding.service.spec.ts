import { ConfigService } from "@nestjs/config";
import { describe, expect, it } from "vitest";
import { KnowledgeEmbeddingService } from "./knowledge-embedding.service";

const chunks = [
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
    content: "杀印相生适合技术、学历、跨境与专业路线。",
    metadata: { tags: ["格局", "杀印相生", "专业"] }
  }
];

describe("KnowledgeEmbeddingService", () => {
  it("uses lexical ranking by default", async () => {
    const service = new KnowledgeEmbeddingService(config({}));

    const ranked = await service.rank("杀印相生 专业", chunks, 2);

    expect(ranked[0]?.id).toBe("pattern");
  });

  it("falls back to lexical ranking when semantic rerank fails", async () => {
    const service = new KnowledgeEmbeddingService(
      config({
        KNOWLEDGE_SEMANTIC_RERANK: "true",
        OPENAI_API_KEY: "test-key"
      })
    );

    Reflect.set(service, "provider", {
      name: "broken",
      dimensions: 3,
      embed: async () => {
        throw new Error("embedding provider unavailable");
      }
    });

    const ranked = await service.rank("杀印相生 专业", chunks, 2);

    expect(ranked[0]?.id).toBe("pattern");
  });

  it("uses persisted pgvector matches when vector search is enabled", async () => {
    const service = new KnowledgeEmbeddingService(
      config({
        KNOWLEDGE_VECTOR_SEARCH: "true"
      }),
      {
        findSimilar: async () => [
          {
            id: "vector-hit",
            sourceTitle: "MVP",
            anchorId: "vector",
            content: "向量库命中。",
            metadata: {},
            score: 0.88
          }
        ]
      } as never
    );

    const ranked = await service.rank("杀印相生 专业", chunks, 2);

    expect(ranked[0]?.id).toBe("vector-hit");
  });

  it("embeds knowledge chunks with source, anchor, tags and content", async () => {
    const service = new KnowledgeEmbeddingService(config({}));

    const embedding = await service.embedKnowledgeChunk({
      id: "pattern",
      sourceTitle: "MVP",
      anchorId: "pattern-shayin",
      content: "杀印相生适合专业路线。",
      metadata: { tags: ["格局", "专业"] }
    });

    expect(embedding).toHaveLength(1536);
    expect(Math.hypot(...embedding)).toBeCloseTo(1, 6);
  });
});

function config(values: Record<string, string>): ConfigService {
  return {
    get: (key: string) => values[key]
  } as ConfigService;
}
