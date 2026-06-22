import { Injectable } from "@nestjs/common";
import type { KnowledgeChunkDto } from "@metamystic/shared";
import { PrismaService } from "../prisma/prisma.service";
import { toPgVectorLiteral } from "./embedding/pgvector";
import type { RankableKnowledgeChunk } from "./knowledge-ranker";

interface KnowledgeVectorRow {
  id: string;
  sourceTitle: string;
  anchorId: string;
  content: string;
  metadata: unknown;
  score: number;
}

@Injectable()
export class KnowledgeVectorRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findSimilar(embedding: number[], limit: number): Promise<KnowledgeChunkDto[]> {
    if (limit <= 0) {
      return [];
    }

    const vector = toPgVectorLiteral(embedding);
    const rows = await this.prisma.$queryRaw<KnowledgeVectorRow[]>`
      SELECT
        kc.id,
        ks.title AS "sourceTitle",
        kc."anchorId",
        kc.content,
        kc.metadata,
        1 - (kc.embedding <=> ${vector}::vector) AS score
      FROM "KnowledgeChunk" kc
      INNER JOIN "KnowledgeSource" ks ON ks.id = kc."sourceId"
      WHERE kc.embedding IS NOT NULL
      ORDER BY kc.embedding <=> ${vector}::vector ASC
      LIMIT ${limit}
    `;

    return rows
      .map((row: KnowledgeVectorRow): KnowledgeChunkDto => ({
        id: row.id,
        sourceTitle: row.sourceTitle,
        anchorId: row.anchorId,
        content: row.content,
        metadata: this.asMetadata(row.metadata),
        score: Number(row.score)
      }))
      .filter((chunk: KnowledgeChunkDto) => Number.isFinite(chunk.score) && chunk.score > 0);
  }

  async findLexical(query: string, limit: number): Promise<KnowledgeChunkDto[]> {
    if (limit <= 0 || !query.trim()) return [];
    const rows = await this.prisma.$queryRaw<KnowledgeVectorRow[]>`
      WITH query_tokens AS (
        SELECT token
        FROM unnest(regexp_split_to_array(lower(${query}), '\\s+')) AS token
        WHERE length(token) >= 2
      )
      SELECT
        kc.id,
        ks.title AS "sourceTitle",
        kc."anchorId",
        kc.content,
        kc.metadata,
        count(DISTINCT qt.token)::double precision AS score
      FROM "KnowledgeChunk" kc
      INNER JOIN "KnowledgeSource" ks ON ks.id = kc."sourceId"
      INNER JOIN query_tokens qt
        ON lower(kc.content || ' ' || kc."anchorId" || ' ' || ks.title || ' ' || kc.metadata::text)
          LIKE '%' || qt.token || '%'
      GROUP BY kc.id, ks.title, kc."anchorId", kc.content, kc.metadata
      ORDER BY score DESC, kc."createdAt" ASC
      LIMIT ${limit}
    `;
    return rows.map((row) => ({
      id: row.id,
      sourceTitle: row.sourceTitle,
      anchorId: row.anchorId,
      content: row.content,
      metadata: this.asMetadata(row.metadata),
      score: Number(row.score)
    }));
  }

  async updateEmbedding(chunkId: string, embedding: number[]): Promise<void> {
    const vector = toPgVectorLiteral(embedding);

    await this.prisma.$executeRaw`
      UPDATE "KnowledgeChunk"
      SET embedding = ${vector}::vector
      WHERE id = ${chunkId}
    `;
  }

  async findChunksMissingEmbeddings(limit: number): Promise<RankableKnowledgeChunk[]> {
    if (limit <= 0) {
      return [];
    }

    const rows = await this.prisma.$queryRaw<Omit<KnowledgeVectorRow, "score">[]>`
      SELECT
        kc.id,
        ks.title AS "sourceTitle",
        kc."anchorId",
        kc.content,
        kc.metadata
      FROM "KnowledgeChunk" kc
      INNER JOIN "KnowledgeSource" ks ON ks.id = kc."sourceId"
      WHERE kc.embedding IS NULL
      ORDER BY kc."createdAt" ASC
      LIMIT ${limit}
    `;

    return rows.map((row: Omit<KnowledgeVectorRow, "score">) => ({
      id: row.id,
      sourceTitle: row.sourceTitle,
      anchorId: row.anchorId,
      content: row.content,
      metadata: this.asMetadata(row.metadata)
    }));
  }

  private asMetadata(value: unknown): Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  }
}
