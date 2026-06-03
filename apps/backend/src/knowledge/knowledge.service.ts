import { Injectable } from "@nestjs/common";
import type { KnowledgeSearchResponse } from "@metamystic/shared";
import { PrismaService } from "../prisma/prisma.service";
import { KnowledgeEmbeddingService } from "./knowledge-embedding.service";

interface KnowledgeChunkWithSource {
  id: string;
  anchorId: string;
  content: string;
  metadata: unknown;
  source: {
    title: string;
  };
}

@Injectable()
export class KnowledgeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddings: KnowledgeEmbeddingService
  ) {}

  async search(query: string, limit = 4): Promise<KnowledgeSearchResponse> {
    const chunks = await this.prisma.knowledgeChunk.findMany({
      include: { source: true },
      orderBy: { createdAt: "asc" },
      take: 80
    });

    const ranked = await this.embeddings.rank(
      query,
      chunks.map((chunk: KnowledgeChunkWithSource) => ({
        id: chunk.id,
        sourceTitle: chunk.source.title,
        anchorId: chunk.anchorId,
        content: chunk.content,
        metadata: this.asMetadata(chunk.metadata)
      })),
      limit
    );

    return { query, chunks: ranked };
  }

  private asMetadata(value: unknown): Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  }
}
