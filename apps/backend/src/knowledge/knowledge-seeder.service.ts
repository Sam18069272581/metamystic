import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { createHash } from "node:crypto";
import { asPrismaJson } from "../prisma/prisma-json";
import { PrismaService } from "../prisma/prisma.service";
import { knowledgeSeed } from "./knowledge-seed";

@Injectable()
export class KnowledgeSeederService implements OnModuleInit {
  private readonly logger = new Logger(KnowledgeSeederService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    if (process.env.KNOWLEDGE_AUTO_SEED === "false") {
      return;
    }

    for (const sourceSeed of knowledgeSeed) {
      const contentChecksum = createHash("sha256")
        .update(sourceSeed.chunks.map((chunk) => chunk.content).join("\n"), "utf8")
        .digest("hex");
      let source = await this.prisma.knowledgeSource.findFirst({
        where: { title: sourceSeed.title, sourceType: sourceSeed.sourceType }
      });
      source ??= await this.prisma.knowledgeSource.create({
        data: {
          title: sourceSeed.title,
          sourceType: sourceSeed.sourceType,
          author: sourceSeed.author ?? null,
          edition: sourceSeed.edition ?? null,
          license: sourceSeed.license ?? null,
          sourceUrl: sourceSeed.sourceUrl ?? null,
          language: sourceSeed.language,
          reviewStatus: sourceSeed.reviewStatus,
          reviewedAt: new Date(),
          contentChecksum,
          contentVersion: sourceSeed.contentVersion,
          metadata: asPrismaJson({ seeded: true })
        }
      });
      source = await this.prisma.knowledgeSource.update({
        where: { id: source.id },
        data: {
          author: sourceSeed.author ?? null,
          edition: sourceSeed.edition ?? null,
          license: sourceSeed.license ?? null,
          sourceUrl: sourceSeed.sourceUrl ?? null,
          language: sourceSeed.language,
          reviewStatus: sourceSeed.reviewStatus,
          reviewedAt: source.reviewedAt ?? new Date(),
          contentChecksum,
          contentVersion: sourceSeed.contentVersion
        }
      });

      for (const chunk of sourceSeed.chunks) {
        await this.prisma.knowledgeChunk.upsert({
          where: {
            sourceId_anchorId: {
              sourceId: source.id,
              anchorId: chunk.anchorId
            }
          },
          update: {
            content: chunk.content,
            chapter: chunk.chapter ?? null,
            pageReference: chunk.pageReference ?? null,
            domain: chunk.domain,
            topic: chunk.topic,
            tags: chunk.tags,
            decisionScenarios: chunk.decisionScenarios,
            language: chunk.language,
            searchText: `${sourceSeed.title} ${chunk.searchText}`.toLowerCase(),
            qualityScore: chunk.qualityScore,
            metadata: asPrismaJson(chunk.metadata)
          },
          create: {
            sourceId: source.id,
            anchorId: chunk.anchorId,
            content: chunk.content,
            chapter: chunk.chapter ?? null,
            pageReference: chunk.pageReference ?? null,
            domain: chunk.domain,
            topic: chunk.topic,
            tags: chunk.tags,
            decisionScenarios: chunk.decisionScenarios,
            language: chunk.language,
            searchText: `${sourceSeed.title} ${chunk.searchText}`.toLowerCase(),
            qualityScore: chunk.qualityScore,
            metadata: asPrismaJson(chunk.metadata)
          }
        });
      }
    }

    this.logger.log("Knowledge seed is ready");
  }
}
