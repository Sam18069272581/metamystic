import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
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
      let source = await this.prisma.knowledgeSource.findFirst({
        where: { title: sourceSeed.title, sourceType: sourceSeed.sourceType }
      });
      source ??= await this.prisma.knowledgeSource.create({
        data: {
          title: sourceSeed.title,
          sourceType: sourceSeed.sourceType,
          metadata: asPrismaJson({ seeded: true })
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
            metadata: asPrismaJson(chunk.metadata)
          },
          create: {
            sourceId: source.id,
            anchorId: chunk.anchorId,
            content: chunk.content,
            metadata: asPrismaJson(chunk.metadata)
          }
        });
      }
    }

    this.logger.log("Knowledge seed is ready");
  }
}
