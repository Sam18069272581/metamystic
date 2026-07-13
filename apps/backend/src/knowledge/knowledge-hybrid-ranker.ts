import type {
  KnowledgeCandidateScoreDto,
  KnowledgeChunkDto,
  KnowledgeRetrievalTraceDto
} from "@metamystic/shared";

const RRF_K = 60;
const WEIGHTS = { tagged: 0.15, lexical: 0.3, vector: 0.55 } as const;

export interface KnowledgeRankings {
  tagged: KnowledgeChunkDto[];
  lexical: KnowledgeChunkDto[];
  vector: KnowledgeChunkDto[];
}

export interface HybridKnowledgeResult {
  chunks: KnowledgeChunkDto[];
  trace: KnowledgeRetrievalTraceDto;
}

export function mergeKnowledgeRankings(rankings: KnowledgeRankings, limit: number): HybridKnowledgeResult {
  const candidates = new Map<string, {
    chunk: KnowledgeChunkDto;
    tagScore?: number;
    lexicalScore?: number;
    vectorScore?: number;
    finalScore: number;
  }>();

  addRanking(candidates, rankings.tagged, "tagged");
  addRanking(candidates, rankings.lexical, "lexical");
  addRanking(candidates, rankings.vector, "vector");

  const ranked = [...candidates.values()]
    .filter((candidate) =>
      candidate.tagScore !== undefined ||
      (candidate.lexicalScore ?? 0) >= 0.18 ||
      (candidate.vectorScore ?? 0) >= 0.62
    )
    .sort((left, right) => right.finalScore - left.finalScore || left.chunk.id.localeCompare(right.chunk.id));
  const selected = ranked.slice(0, Math.max(0, limit));
  const traceCandidates: KnowledgeCandidateScoreDto[] = ranked.map((candidate) => ({
    id: candidate.chunk.id,
    ...(candidate.tagScore !== undefined ? { tagScore: candidate.tagScore } : {}),
    ...(candidate.lexicalScore !== undefined ? { lexicalScore: candidate.lexicalScore } : {}),
    ...(candidate.vectorScore !== undefined ? { vectorScore: candidate.vectorScore } : {}),
    finalScore: round(candidate.finalScore)
  }));

  return {
    chunks: selected.map((candidate) => ({ ...candidate.chunk, score: round(candidate.finalScore) })),
    trace: {
      retrievalVersion: "hybrid-rrf-v2",
      corpusVersion: "knowledge-v2",
      candidates: traceCandidates,
      citations: selected.map((candidate) => candidate.chunk.id)
    }
  };
}

function addRanking(
  candidates: Map<string, {
    chunk: KnowledgeChunkDto;
    tagScore?: number;
    lexicalScore?: number;
    vectorScore?: number;
    finalScore: number;
  }>,
  chunks: KnowledgeChunkDto[],
  channel: keyof typeof WEIGHTS
): void {
  chunks.forEach((chunk, index) => {
    const candidate = candidates.get(chunk.id) ?? { chunk, finalScore: 0 };
    candidate.finalScore += WEIGHTS[channel] / (RRF_K + index + 1);
    if (channel === "tagged") candidate.tagScore = chunk.score;
    if (channel === "lexical") candidate.lexicalScore = chunk.score;
    if (channel === "vector") candidate.vectorScore = chunk.score;
    candidates.set(chunk.id, candidate);
  });
}

function round(value: number): number {
  return Number(value.toFixed(8));
}
