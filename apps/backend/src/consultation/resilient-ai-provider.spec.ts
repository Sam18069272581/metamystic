import { describe, expect, it } from "vitest";
import { ResilientAiProvider } from "./ai-provider";
import type { AiConsultationInput, AiProvider } from "./ai-provider";

describe("ResilientAiProvider", () => {
  it("falls back to mock-compatible chunks when the primary provider fails", async () => {
    const primary: AiProvider = {
      providerName: "openai",
      model: "gpt-4.1-mini",
      async *streamConsultation() {
        throw new Error("OpenAI unavailable");
      }
    };
    const fallback: AiProvider = {
      providerName: "mock",
      model: "rule-based",
      async *streamConsultation() {
        yield { section: "verdict", content: "\u672c\u5730\u56de\u9000\u7ed3\u8bba\u3002" };
      }
    };
    const provider = new ResilientAiProvider(primary, fallback);
    const chunks = [];

    for await (const chunk of provider.streamConsultation(input())) {
      chunks.push(chunk);
    }

    expect(chunks).toEqual([
      {
        type: "provider",
        providerName: "openai",
        model: "gpt-4.1-mini",
        status: "primary",
        isFallback: false
      },
      {
        type: "provider",
        providerName: "mock",
        model: "rule-based",
        status: "fallback",
        isFallback: true,
        failedProviderName: "openai",
        reason: "Primary AI provider unavailable",
        durationMs: expect.any(Number)
      },
      { section: "verdict", content: "\u672c\u5730\u56de\u9000\u7ed3\u8bba\u3002" }
    ]);
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
        year: { stem: "\u4e59", branch: "\u4ea5", tenGod: "\u6bd4\u80a9", hiddenStems: ["\u58ec"], nayin: "\u5c71\u5934\u706b" },
        month: { stem: "\u8f9b", branch: "\u5df3", tenGod: "\u4e03\u6740", hiddenStems: ["\u4e19"], nayin: "\u767d\u8721\u91d1" },
        day: { stem: "\u4e59", branch: "\u536f", tenGod: "\u65e5\u4e3b", hiddenStems: ["\u4e59"], nayin: "\u5927\u6eaa\u6c34" },
        hour: { stem: "\u8f9b", branch: "\u5df3", tenGod: "\u4e03\u6740", hiddenStems: ["\u4e19"], nayin: "\u767d\u8721\u91d1" }
      },
      elements: { wood: 0.32, fire: 0.22, earth: 0.15, metal: 0.2, water: 0.11 },
      createdAt: "2026-05-29T00:00:00.000Z"
    },
    citations: [],
    disclaimer: "\u4ec5\u4f9b\u53c2\u8003\u3002"
  };
}
