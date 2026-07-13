import { Injectable } from "@nestjs/common";
import type { KnowledgeSearchResponse } from "@metamystic/shared";
import { KnowledgeEmbeddingService } from "./knowledge-embedding.service";
import { mergeKnowledgeRankings } from "./knowledge-hybrid-ranker";
import { KnowledgeVectorRepository } from "./knowledge-vector.repository";

@Injectable()
export class KnowledgeService {
  constructor(
    private readonly embeddings: KnowledgeEmbeddingService,
    private readonly repository: KnowledgeVectorRepository
  ) {}

  async search(query: string, limit = 4): Promise<KnowledgeSearchResponse> {
    const candidateLimit = Math.max(limit * 3, limit);
    const [tagged, lexical, vector] = await Promise.all([
      this.repository.findTagged(query, candidateLimit),
      this.repository.findLexical(query, candidateLimit),
      this.embeddings.searchVector(query, candidateLimit)
    ]);
    const result = mergeKnowledgeRankings({ tagged, lexical, vector }, limit);

    return {
      query,
      chunks: result.chunks,
      retrievalVersion: "hybrid-rrf-v2",
      trace: result.trace
    };
  }
}
