export interface KnowledgeEvaluationCase {
  query: string;
  expectedAnchorIds: string[];
}

export interface KnowledgeEvaluationMetrics {
  hitAt3: number;
  mrr: number;
}

export function evaluateKnowledgeRetrieval(
  cases: KnowledgeEvaluationCase[],
  retrieve: (query: string) => string[]
): KnowledgeEvaluationMetrics {
  if (cases.length === 0) return { hitAt3: 0, mrr: 0 };
  let hits = 0;
  let reciprocalRank = 0;

  for (const testCase of cases) {
    const ranked = retrieve(testCase.query);
    const rank = ranked.findIndex((anchorId) => testCase.expectedAnchorIds.includes(anchorId));
    if (rank >= 0 && rank < 3) hits += 1;
    if (rank >= 0) reciprocalRank += 1 / (rank + 1);
  }

  return {
    hitAt3: hits / cases.length,
    mrr: reciprocalRank / cases.length
  };
}
