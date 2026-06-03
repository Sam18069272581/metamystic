import { describe, expect, it } from "vitest";
import { parseEmbeddingBackfillLimit } from "./knowledge-embedding.cli-options";

describe("parseEmbeddingBackfillLimit", () => {
  it("uses a conservative default limit", () => {
    expect(parseEmbeddingBackfillLimit([])).toBe(50);
  });

  it("parses --limit values", () => {
    expect(parseEmbeddingBackfillLimit(["--limit", "12"])).toBe(12);
  });

  it("rejects invalid limits", () => {
    expect(() => parseEmbeddingBackfillLimit(["--limit", "0"])).toThrow("positive integer");
  });
});
