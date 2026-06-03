import { Injectable, Logger } from "@nestjs/common";
import { KnowledgeEmbeddingService } from "./knowledge-embedding.service";
import { KnowledgeVectorRepository } from "./knowledge-vector.repository";

export interface KnowledgeEmbeddingBackfillResult {
  processed: number;
  failed: number;
}

@Injectable()
export class KnowledgeEmbeddingBackfillService {
  private readonly logger = new Logger(KnowledgeEmbeddingBackfillService.name);

  constructor(
    private readonly vectorRepository: KnowledgeVectorRepository,
    private readonly embeddings: KnowledgeEmbeddingService
  ) {}

  async backfillMissingEmbeddings(limit: number): Promise<KnowledgeEmbeddingBackfillResult> {
    const chunks = await this.vectorRepository.findChunksMissingEmbeddings(limit);
    let processed = 0;
    let failed = 0;

    for (const chunk of chunks) {
      try {
        const embedding = await this.embeddings.embedKnowledgeChunk(chunk);
        await this.vectorRepository.updateEmbedding(chunk.id, embedding);
        processed += 1;
      } catch (error) {
        failed += 1;
        this.logger.warn(`Failed to backfill embedding for knowledge chunk ${chunk.id}. ${String(error)}`);
      }
    }

    return { processed, failed };
  }
}
