import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { KnowledgeChunkDto } from "@metamystic/shared";
import {
  createEmbeddingProvider,
  type EmbeddingProvider
} from "./embedding/embedding-provider";
import { rankByVectorSimilarity, type VectorRankableKnowledgeChunk } from "./embedding/vector-ranker";
import { rankKnowledgeChunks, type RankableKnowledgeChunk } from "./knowledge-ranker";
import { KnowledgeVectorRepository } from "./knowledge-vector.repository";

@Injectable()
export class KnowledgeEmbeddingService {
  private readonly logger = new Logger(KnowledgeEmbeddingService.name);
  private readonly provider: EmbeddingProvider;

  constructor(
    private readonly config: ConfigService,
    private readonly vectorRepository?: KnowledgeVectorRepository
  ) {
    const providerConfig = {
      openAiApiKey: this.config.get<string>("OPENAI_API_KEY"),
      model: this.config.get<string>("OPENAI_EMBEDDING_MODEL"),
      dimensions: this.parseDimensions(this.config.get<string>("OPENAI_EMBEDDING_DIMENSIONS"))
    };

    this.provider = createEmbeddingProvider(
      Object.fromEntries(Object.entries(providerConfig).filter(([, value]) => value !== undefined))
    );
  }

  async rank(query: string, chunks: RankableKnowledgeChunk[], limit: number): Promise<KnowledgeChunkDto[]> {
    const lexicalRanking = rankKnowledgeChunks(query, chunks, limit);

    if (this.isVectorSearchEnabled()) {
      try {
        const queryEmbedding = await this.provider.embed(query);
        const vectorRanking = await this.vectorRepository?.findSimilar(queryEmbedding, limit);

        if (vectorRanking?.length) {
          return vectorRanking;
        }
      } catch (error) {
        this.logger.warn(`Knowledge vector search failed; falling back to lexical ranking. ${String(error)}`);
      }
    }

    if (!this.isSemanticRerankEnabled() || chunks.length === 0) {
      return lexicalRanking;
    }

    try {
      const queryEmbedding = await this.provider.embed(query);
      const embeddedChunks = await Promise.all(
        chunks.map(async (chunk): Promise<VectorRankableKnowledgeChunk> => ({
          ...chunk,
          embedding: await this.provider.embed(this.toEmbeddingInput(chunk))
        }))
      );
      const semanticRanking = rankByVectorSimilarity(queryEmbedding, embeddedChunks, limit);

      return semanticRanking.length > 0 ? semanticRanking : lexicalRanking;
    } catch (error) {
      this.logger.warn(`Semantic knowledge rerank failed; falling back to lexical ranking. ${String(error)}`);
      return lexicalRanking;
    }
  }

  async embedKnowledgeChunk(chunk: RankableKnowledgeChunk): Promise<number[]> {
    return this.provider.embed(this.toEmbeddingInput(chunk));
  }

  private isSemanticRerankEnabled(): boolean {
    return this.config.get<string>("KNOWLEDGE_SEMANTIC_RERANK") === "true";
  }

  private isVectorSearchEnabled(): boolean {
    return this.config.get<string>("KNOWLEDGE_VECTOR_SEARCH") === "true";
  }

  private parseDimensions(value: string | undefined): number | undefined {
    if (!value) {
      return undefined;
    }

    const parsed = Number.parseInt(value, 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
  }

  private toEmbeddingInput(chunk: RankableKnowledgeChunk): string {
    const tags = Array.isArray(chunk.metadata.tags) ? chunk.metadata.tags.map(String).join(" ") : "";
    return `${chunk.sourceTitle} ${chunk.anchorId} ${tags} ${chunk.content}`;
  }
}
