import { describe, expect, it } from "vitest";
import { knowledgeSeed } from "./knowledge-seed";

describe("knowledgeSeed", () => {
  const chunks = knowledgeSeed.flatMap((source) => source.chunks);

  it("contains structured MVP knowledge across core decision topics", () => {
    expect(chunks.length).toBeGreaterThanOrEqual(18);

    const topics = chunks.map((chunk) => chunk.metadata.topic);

    expect(topics).toEqual(
      expect.arrayContaining(["career", "relationship", "study_abroad", "wealth", "decision_safety"])
    );
  });

  it("stores searchable metadata on every chunk", () => {
    for (const chunk of chunks) {
      expect(chunk.content).not.toMatch(/[锛屻€傜殑]/);
      expect(chunk.metadata.domain).toBe("bazi");
      expect(chunk.metadata.topic).toEqual(expect.any(String));
      expect(chunk.metadata.classicalSource).toEqual(expect.stringMatching(/^《.+》/));
      expect(chunk.metadata.displayTitle).toEqual(expect.any(String));
      expect(chunk.metadata.tags.length).toBeGreaterThanOrEqual(2);
      expect(chunk.metadata.decisionScenarios.length).toBeGreaterThanOrEqual(1);
    }
  });
});
