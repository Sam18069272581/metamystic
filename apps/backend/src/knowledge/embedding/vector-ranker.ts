import type { KnowledgeChunkDto } from "@metamystic/shared";

export type VectorRankableKnowledgeChunk = Omit<KnowledgeChunkDto, "score"> & {
  embedding: number[];
};

export function rankByVectorSimilarity(
  queryEmbedding: number[],
  chunks: VectorRankableKnowledgeChunk[],
  limit: number
): KnowledgeChunkDto[] {
  if (limit <= 0) {
    return [];
  }

  return chunks
    .map((chunk) => ({
      ...chunk,
      score: cosineSimilarity(queryEmbedding, chunk.embedding)
    }))
    .filter((chunk) => Number.isFinite(chunk.score))
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map(({ embedding: _embedding, ...chunk }) => chunk);
}

function cosineSimilarity(left: number[], right: number[]): number {
  if (left.length === 0 || left.length !== right.length) {
    return 0;
  }

  let dotProduct = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (let index = 0; index < left.length; index += 1) {
    const leftValue = left[index] ?? 0;
    const rightValue = right[index] ?? 0;

    dotProduct += leftValue * rightValue;
    leftMagnitude += leftValue * leftValue;
    rightMagnitude += rightValue * rightValue;
  }

  const denominator = Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude);
  return denominator === 0 ? 0 : dotProduct / denominator;
}
