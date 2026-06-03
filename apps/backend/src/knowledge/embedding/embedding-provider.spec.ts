import { describe, expect, it } from "vitest";
import { createEmbeddingProvider } from "./embedding-provider";

describe("createEmbeddingProvider", () => {
  it("uses a deterministic local provider when no OpenAI key is configured", async () => {
    const provider = createEmbeddingProvider({
      openAiApiKey: "",
      model: "text-embedding-3-small",
      dimensions: 16
    });

    const first = await provider.embed("杀印相生适合专业路线");
    const second = await provider.embed("杀印相生适合专业路线");

    expect(provider.name).toBe("local-hash");
    expect(first).toEqual(second);
    expect(first).toHaveLength(16);
    expect(Math.hypot(...first)).toBeCloseTo(1, 6);
  });
});
