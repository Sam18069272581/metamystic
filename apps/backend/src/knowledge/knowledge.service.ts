import { Injectable } from "@nestjs/common";
import type { KnowledgeSearchResponse } from "@metamystic/shared";
import { KnowledgeEmbeddingService } from "./knowledge-embedding.service";
import { KnowledgeVectorRepository } from "./knowledge-vector.repository";

@Injectable()
export class KnowledgeService {
  constructor(
    private readonly embeddings: KnowledgeEmbeddingService,
    private readonly repository: KnowledgeVectorRepository
  ) {}

  async search(query: string, limit = 4): Promise<KnowledgeSearchResponse> {
    const chunks = await this.repository.findLexical(query, Math.max(limit * 3, limit));

    const ranked = await this.embeddings.rank(
      query,
      chunks.map((chunk) => ({
        id: chunk.id,
        sourceTitle: chunk.sourceTitle,
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
