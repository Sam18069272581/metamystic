const DEFAULT_LIMIT = 50;

export function parseEmbeddingBackfillLimit(args: string[]): number {
  const limitFlagIndex = args.indexOf("--limit");

  if (limitFlagIndex === -1) {
    return DEFAULT_LIMIT;
  }

  const rawLimit = args.at(limitFlagIndex + 1);
  const limit = rawLimit ? Number.parseInt(rawLimit, 10) : Number.NaN;

  if (!Number.isInteger(limit) || limit <= 0) {
    throw new Error("Embedding backfill limit must be a positive integer.");
  }

  return limit;
}
