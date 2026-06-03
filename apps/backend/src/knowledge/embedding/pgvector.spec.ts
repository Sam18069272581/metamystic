import { describe, expect, it } from "vitest";
import { toPgVectorLiteral } from "./pgvector";

describe("toPgVectorLiteral", () => {
  it("serializes finite embedding values for pgvector casts", () => {
    expect(toPgVectorLiteral([0.25, -1, 0])).toBe("[0.25,-1,0]");
  });

  it("rejects non-finite embedding values", () => {
    expect(() => toPgVectorLiteral([1, Number.NaN])).toThrow("finite numbers");
  });
});
