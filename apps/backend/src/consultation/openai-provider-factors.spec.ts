import { describe, expect, it, vi } from "vitest";
import { OpenAiConsultationProvider } from "./ai-provider";
import type { AiConsultationInput } from "./ai-provider";

describe("OpenAiConsultationProvider chart factors fallback", () => {
  it("adds deterministic chart factors when the model omits the factors heading", async () => {
    const create = vi.fn().mockResolvedValue(
      (async function* () {
        yield { choices: [{ delta: { content: "## \u7ed3\u8bba\n\u5148\u5c0f\u6b65\u9a8c\u8bc1\u3002\n\n" } }] };
        yield { choices: [{ delta: { content: "## \u73b0\u5b9e\u5efa\u8bae\n\u4e03\u5929\u5185\u505a\u4e00\u6b21\u53ef\u9a8c\u8bc1\u52a8\u4f5c\u3002" } }] };
      })()
    );
    const provider = new OpenAiConsultationProvider({
      apiKey: "test-key",
      model: "gpt-4.1-mini",
      client: { chat: { completions: { create } } } as never
    });

    const chunks = [];
    for await (const chunk of provider.streamConsultation(input())) {
      chunks.push(chunk);
    }

    expect(chunks).toContainEqual(
      expect.objectContaining({
        section: "factors",
        content: expect.stringContaining("\u65e5\u4e3b")
      })
    );
    expect(chunks.findIndex((chunk) => chunk.section === "factors")).toBeLessThan(
      chunks.findIndex((chunk) => chunk.section === "advice")
    );
  });

  it("places deterministic chart factors before citations when advice is missing", async () => {
    const create = vi.fn().mockResolvedValue(
      (async function* () {
        yield { choices: [{ delta: { content: "## \u7ed3\u8bba\n\u5148\u5c0f\u6b65\u9a8c\u8bc1\u3002\n\n" } }] };
        yield { choices: [{ delta: { content: "## \u53c2\u8003\u4f9d\u636e\n[K1] pattern-shayin\n\n" } }] };
        yield { choices: [{ delta: { content: "## \u514d\u8d23\u58f0\u660e\n\u4ec5\u4f9b\u53c2\u8003\u3002" } }] };
      })()
    );
    const provider = new OpenAiConsultationProvider({
      apiKey: "test-key",
      model: "gpt-4.1-mini",
      client: { chat: { completions: { create } } } as never
    });

    const chunks = [];
    for await (const chunk of provider.streamConsultation(input())) {
      chunks.push(chunk);
    }

    expect(chunks.map((chunk) => chunk.section)).toEqual(["verdict", "factors", "citation", "disclaimer"]);
  });
});

function input(): AiConsultationInput {
  return {
    question: "\u6211\u9002\u5408\u53bb\u5fb7\u56fd\u53d1\u5c55\u5417\uff1f",
    tone: "strategic",
    chart: {
      id: "chart-1",
      profileId: "profile-1",
      dayMaster: "\u4e59",
      dayMasterStatus: "weak",
      mainPattern: "\u6740\u5370\u76f8\u751f",
      pillars: {
        year: { stem: "\u4e59", branch: "\u4ea5", tenGod: "\u6bd4\u80a9", hiddenStems: ["\u58ec"] },
        month: { stem: "\u8f9b", branch: "\u5df3", tenGod: "\u4e03\u6740", hiddenStems: ["\u4e19"] },
        day: { stem: "\u4e59", branch: "\u536f", tenGod: "\u65e5\u4e3b", hiddenStems: ["\u4e59"] },
        hour: { stem: "\u8f9b", branch: "\u5df3", tenGod: "\u4e03\u6740", hiddenStems: ["\u4e19"] }
      },
      elements: { wood: 0.32, fire: 0.22, earth: 0.15, metal: 0.2, water: 0.11 },
      usefulGods: ["water", "wood"],
      unfavorableGods: ["metal"],
      createdAt: "2026-05-29T00:00:00.000Z"
    },
    citations: [],
    disclaimer: "\u4ec5\u4f9b\u53c2\u8003\u3002"
  };
}
