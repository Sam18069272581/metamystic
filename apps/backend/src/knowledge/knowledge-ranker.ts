import type { KnowledgeChunkDto } from "@metamystic/shared";

export interface RankableKnowledgeChunk {
  id: string;
  sourceTitle: string;
  anchorId: string;
  content: string;
  metadata: Record<string, unknown>;
}

const domainTerms = [
  "正官",
  "七杀",
  "正印",
  "偏印",
  "食神生财",
  "食神",
  "伤官",
  "正财",
  "偏财",
  "比肩",
  "劫财",
  "杀印相生",
  "伤官配印",
  "身弱",
  "身强",
  "日主",
  "事业",
  "职业",
  "关系",
  "出国",
  "留学",
  "德国",
  "学习",
  "专业",
  "压力",
  "财富",
  "财运",
  "决策"
];

const stopWords = ["什么", "问题", "适合", "发展", "可以", "应该", "是否", "一个", "怎么"];

export function rankKnowledgeChunks(
  query: string,
  chunks: RankableKnowledgeChunk[],
  limit: number
): KnowledgeChunkDto[] {
  const tokens = tokenizeKnowledgeQuery(query);
  if (tokens.length === 0) {
    return [];
  }

  return chunks
    .map((chunk) => ({
      ...chunk,
      score: scoreKnowledgeChunk(tokens, chunk)
    }))
    .filter((chunk) => chunk.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);
}

export function tokenizeKnowledgeQuery(query: string): string[] {
  const normalized = query.toLowerCase();
  const exactTerms = domainTerms.filter((term) => normalized.includes(term.toLowerCase()));
  const looseTerms = normalized
    .split(/[，。！？、,.!?\s]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2 && !stopWords.includes(token));
  return [...new Set([...exactTerms, ...looseTerms])];
}

function scoreKnowledgeChunk(tokens: string[], chunk: RankableKnowledgeChunk): number {
  const tags = Array.isArray(chunk.metadata.tags) ? chunk.metadata.tags.map(String) : [];
  const scenarios = Array.isArray(chunk.metadata.decisionScenarios)
    ? chunk.metadata.decisionScenarios.map(String)
    : [];
  const haystack =
    `${chunk.content} ${tags.join(" ")} ${scenarios.join(" ")} ${chunk.anchorId} ${chunk.sourceTitle}`.toLowerCase();

  return tokens.reduce((sum, token) => {
    const normalizedToken = token.toLowerCase();
    if (!haystack.includes(normalizedToken)) {
      return sum;
    }
    const isExactDomainTerm = domainTerms.includes(token);
    return sum + (isExactDomainTerm ? 3 : 1);
  }, 0);
}
