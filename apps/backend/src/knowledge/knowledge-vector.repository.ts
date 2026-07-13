import { Injectable } from "@nestjs/common";
import type { KnowledgeChunkDto } from "@metamystic/shared";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { toPgVectorLiteral } from "./embedding/pgvector";
import type { RankableKnowledgeChunk } from "./knowledge-ranker";

interface KnowledgeRow {
  id: string;
  sourceTitle: string;
  sourceType: string;
  sourceAuthor: string | null;
  sourceEdition: string | null;
  sourceUrl: string | null;
  license: string | null;
  contentChecksum: string | null;
  contentVersion: string | null;
  reviewStatus: "reviewed" | "published";
  anchorId: string;
  content: string;
  chapter: string | null;
  pageReference: string | null;
  domain: string;
  topic: string;
  tags: string[];
  decisionScenarios: string[];
  language: string;
  qualityScore: number;
  metadata: unknown;
  score: number;
}

const SELECT_FIELDS = Prisma.raw(`
  kc.id,
  ks.title AS "sourceTitle",
  ks."sourceType",
  ks.author AS "sourceAuthor",
  ks.edition AS "sourceEdition",
  ks."sourceUrl",
  ks.license,
  ks."contentChecksum",
  ks."contentVersion",
  ks."reviewStatus",
  kc."anchorId",
  kc.content,
  kc.chapter,
  kc."pageReference",
  kc.domain,
  kc.topic,
  kc.tags,
  kc."decisionScenarios",
  kc.language,
  kc."qualityScore",
  kc.metadata
`);

@Injectable()
export class KnowledgeVectorRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findSimilar(embedding: number[], limit: number): Promise<KnowledgeChunkDto[]> {
    if (limit <= 0) return [];
    const vector = toPgVectorLiteral(embedding);
    const rows = await this.prisma.$queryRaw<KnowledgeRow[]>(Prisma.sql`
      SELECT ${SELECT_FIELDS}, 1 - (kc.embedding <=> ${vector}::vector) AS score
      FROM "KnowledgeChunk" kc
      INNER JOIN "KnowledgeSource" ks ON ks.id = kc."sourceId"
      WHERE kc.embedding IS NOT NULL
        AND ks."reviewStatus" IN ('reviewed', 'published')
      ORDER BY kc.embedding <=> ${vector}::vector ASC
      LIMIT ${limit}
    `);
    return this.mapRows(rows).filter((chunk) => Number.isFinite(chunk.score) && chunk.score > 0);
  }

  async findTagged(query: string, limit: number): Promise<KnowledgeChunkDto[]> {
    if (limit <= 0 || !query.trim()) return [];
    const rows = await this.prisma.$queryRaw<KnowledgeRow[]>(Prisma.sql`
      SELECT ${SELECT_FIELDS},
        (
          SELECT count(*)::double precision
          FROM unnest(kc.tags || kc."decisionScenarios") term
          WHERE length(term) >= 2 AND position(lower(term) in lower(${query})) > 0
        ) + CASE WHEN position(lower(kc.topic) in lower(${query})) > 0 THEN 1 ELSE 0 END AS score
      FROM "KnowledgeChunk" kc
      INNER JOIN "KnowledgeSource" ks ON ks.id = kc."sourceId"
      WHERE ks."reviewStatus" IN ('reviewed', 'published')
        AND (
          EXISTS (
            SELECT 1 FROM unnest(kc.tags || kc."decisionScenarios") term
            WHERE length(term) >= 2 AND position(lower(term) in lower(${query})) > 0
          )
          OR position(lower(kc.topic) in lower(${query})) > 0
        )
      ORDER BY score DESC, kc."qualityScore" DESC, kc."createdAt" ASC
      LIMIT ${limit}
    `);
    return this.mapRows(rows);
  }

  async findLexical(query: string, limit: number): Promise<KnowledgeChunkDto[]> {
    if (limit <= 0 || !query.trim()) return [];
    const rows = await this.prisma.$queryRaw<KnowledgeRow[]>(Prisma.sql`
      SELECT ${SELECT_FIELDS}, relevance.score
      FROM "KnowledgeChunk" kc
      INNER JOIN "KnowledgeSource" ks ON ks.id = kc."sourceId"
      CROSS JOIN LATERAL (
        SELECT GREATEST(
          similarity(kc."searchText", lower(${query})),
          word_similarity(lower(${query}), kc."searchText")
        )::double precision AS score
      ) relevance
      WHERE ks."reviewStatus" IN ('reviewed', 'published')
        AND (
          kc."searchText" % lower(${query})
          OR relevance.score >= 0.18
        )
      ORDER BY relevance.score DESC, kc."qualityScore" DESC, kc."createdAt" ASC
      LIMIT ${limit}
    `);
    return this.mapRows(rows);
  }

  async updateEmbedding(chunkId: string, embedding: number[]): Promise<void> {
    const vector = toPgVectorLiteral(embedding);
    await this.prisma.$executeRaw`
      UPDATE "KnowledgeChunk" SET embedding = ${vector}::vector WHERE id = ${chunkId}
    `;
  }

  async findChunksMissingEmbeddings(limit: number): Promise<RankableKnowledgeChunk[]> {
    if (limit <= 0) return [];
    const rows = await this.prisma.$queryRaw<KnowledgeRow[]>(Prisma.sql`
      SELECT ${SELECT_FIELDS}, 0::double precision AS score
      FROM "KnowledgeChunk" kc
      INNER JOIN "KnowledgeSource" ks ON ks.id = kc."sourceId"
      WHERE kc.embedding IS NULL
        AND ks."reviewStatus" IN ('reviewed', 'published')
      ORDER BY kc."createdAt" ASC
      LIMIT ${limit}
    `);
    return this.mapRows(rows).map((row) => ({
      id: row.id,
      sourceTitle: row.sourceTitle,
      anchorId: row.anchorId,
      content: row.content,
      metadata: row.metadata
    }));
  }

  private mapRows(rows: KnowledgeRow[]): KnowledgeChunkDto[] {
    return rows.map((row) => ({
      id: row.id,
      sourceTitle: row.sourceTitle,
      sourceType: row.sourceType ?? "platform_explanation",
      ...(row.sourceAuthor ? { sourceAuthor: row.sourceAuthor } : {}),
      ...(row.sourceEdition ? { sourceEdition: row.sourceEdition } : {}),
      ...(row.sourceUrl ? { sourceUrl: row.sourceUrl } : {}),
      ...(row.license ? { license: row.license } : {}),
      ...(row.contentChecksum ? { contentChecksum: row.contentChecksum } : {}),
      ...(row.contentVersion ? { contentVersion: row.contentVersion } : {}),
      reviewStatus: row.reviewStatus ?? "published",
      anchorId: row.anchorId,
      content: row.content,
      ...(row.chapter ? { chapter: row.chapter } : {}),
      ...(row.pageReference ? { pageReference: row.pageReference } : {}),
      domain: row.domain ?? "bazi",
      topic: row.topic ?? "general",
      tags: row.tags ?? [],
      decisionScenarios: row.decisionScenarios ?? [],
      language: row.language ?? "zh",
      qualityScore: Number.isFinite(Number(row.qualityScore)) ? Number(row.qualityScore) : 0.5,
      metadata: this.asMetadata(row.metadata),
      score: Number(row.score)
    }));
  }

  private asMetadata(value: unknown): Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  }
}
