import { describe, expect, it, vi } from "vitest";
import { OpenAiConsultationProvider } from "./ai-provider";
import type { AiConsultationInput } from "./ai-provider";

describe("OpenAiConsultationProvider", () => {
  it("streams OpenAI text through parsed consultation sections", async () => {
    const create = vi.fn().mockResolvedValue(
      (async function* () {
        yield { choices: [{ delta: { content: "## 结论\n适合先验证。\n\n" } }] };
        yield { choices: [{ delta: { content: "## 参考依据\n[K1] pattern-shayin" } }] };
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

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gpt-4.1-mini",
        stream: true,
        messages: expect.arrayContaining([
          expect.objectContaining({ role: "system" }),
          expect.objectContaining({ role: "user" })
        ])
      })
    );
    expect(chunks).toEqual([
      { section: "verdict", content: "适合先验证。" },
      expect.objectContaining({
        section: "factors",
        content: expect.stringContaining("日主 乙 / weak")
      }),
      { section: "citation", content: "[K1] pattern-shayin" }
    ]);
  });
});

function input(): AiConsultationInput {
  return {
    question: "我适合去德国发展吗？",
    tone: "strategic",
    chart: {
      id: "chart-1",
      profileId: "profile-1",
      dayMaster: "乙",
      dayMasterStatus: "weak",
      mainPattern: "杀印相生",
      pillars: {
        year: { stem: "乙", branch: "亥", tenGod: "比肩", hiddenStems: ["壬"], nayin: "山头火" },
        month: { stem: "辛", branch: "巳", tenGod: "七杀", hiddenStems: ["丙"], nayin: "白蜡金" },
        day: { stem: "乙", branch: "卯", tenGod: "日主", hiddenStems: ["乙"], nayin: "大溪水" },
        hour: { stem: "辛", branch: "巳", tenGod: "七杀", hiddenStems: ["丙"], nayin: "白蜡金" }
      },
      elements: { wood: 0.32, fire: 0.22, earth: 0.15, metal: 0.2, water: 0.11 },
      createdAt: "2026-05-29T00:00:00.000Z"
    },
    citations: [],
    disclaimer: "仅供参考。"
  };
}
