export function toPgVectorLiteral(embedding: number[]): string {
  if (embedding.length === 0 || embedding.some((value) => !Number.isFinite(value))) {
    throw new Error("Embedding vector must contain finite numbers.");
  }

  return `[${embedding.join(",")}]`;
}
