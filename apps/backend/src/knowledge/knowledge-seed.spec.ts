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
      expect(chunk.domain).toBe("bazi");
      expect(chunk.topic).toEqual(expect.any(String));
      expect(chunk.sourceKind).toMatch(/^(platformExplanation|classicalOriginal)$/);
      expect(chunk.metadata).not.toHaveProperty("classicalSource");
      expect(chunk.searchText.length).toBeGreaterThan(chunk.content.length);
      expect(chunk.tags.length).toBeGreaterThanOrEqual(2);
      expect(chunk.decisionScenarios.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("keeps platform explanations separate from reviewed classical originals", () => {
    const platform = knowledgeSeed.find((source) => source.sourceType === "platform_explanation");
    const originals = knowledgeSeed.filter((source) => source.sourceType === "classical_original");

    expect(platform?.reviewStatus).toBe("published");
    expect(platform?.chunks.every((chunk) => chunk.sourceKind === "platformExplanation")).toBe(true);
    expect(originals.map((source) => source.title)).toEqual(expect.arrayContaining(["《滴天髓》", "《穷通宝鉴》"]));
    for (const source of originals) {
      expect(source.sourceUrl).toMatch(/^https:\/\/zh\.wikisource\.org\//);
      expect(source.license).toEqual(expect.any(String));
      expect(source.reviewStatus).toBe("published");
      expect(source.chunks.every((chunk) => chunk.sourceKind === "classicalOriginal")).toBe(true);
    }
  });
});
