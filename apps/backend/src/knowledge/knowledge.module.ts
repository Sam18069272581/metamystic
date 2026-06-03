import { Module } from "@nestjs/common";
import { KnowledgeController } from "./knowledge.controller";
import { KnowledgeEmbeddingBackfillService } from "./knowledge-embedding-backfill.service";
import { KnowledgeEmbeddingService } from "./knowledge-embedding.service";
import { KnowledgeSeederService } from "./knowledge-seeder.service";
import { KnowledgeService } from "./knowledge.service";
import { KnowledgeVectorRepository } from "./knowledge-vector.repository";

@Module({
  controllers: [KnowledgeController],
  providers: [
    KnowledgeService,
    KnowledgeSeederService,
    KnowledgeEmbeddingService,
    KnowledgeVectorRepository,
    KnowledgeEmbeddingBackfillService
  ],
  exports: [KnowledgeService]
})
export class KnowledgeModule {}
