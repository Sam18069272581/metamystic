import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "../app.module";
import { KnowledgeEmbeddingBackfillService } from "./knowledge-embedding-backfill.service";
import { parseEmbeddingBackfillLimit } from "./knowledge-embedding.cli-options";

async function run(): Promise<void> {
  const logger = new Logger("KnowledgeEmbeddingCli");
  const limit = parseEmbeddingBackfillLimit(process.argv.slice(2));
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ["log", "warn", "error"] });

  try {
    const service = app.get(KnowledgeEmbeddingBackfillService);
    const result = await service.backfillMissingEmbeddings(limit);
    logger.log(`Knowledge embedding backfill finished. processed=${result.processed} failed=${result.failed}`);
  } finally {
    await app.close();
  }
}

void run().catch((error: unknown) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exitCode = 1;
});
