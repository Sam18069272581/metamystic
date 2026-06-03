import { describe, expect, it } from "vitest";
import { extractProfileMemorySignals, mergeProfileMemorySignals } from "./profile-memory";

describe("profile memory", () => {
  it("extracts decision topics and risk preferences from a completed consultation", () => {
    const signals = extractProfileMemorySignals({
      consultationId: "consult-1",
      question: "\u6211\u9002\u5408\u53bb\u5fb7\u56fd\u53d1\u5c55\u5417\uff1f\u6211\u5f88\u62c5\u5fc3\u98ce\u9669\u548c\u7b7e\u8bc1\u3002",
      answer:
        "\u7ed3\u8bba\uff1a\u53ef\u4ee5\u63a8\u8fdb\uff0c\u4f46\u5efa\u8bae\u5148\u5c0f\u6b65\u9a8c\u8bc1\u3002\u73b0\u5b9e\u5efa\u8bae\uff1a\u5148\u505a\u8bed\u8a00\u3001\u7b7e\u8bc1\u548c\u804c\u4e1a\u8def\u5f84\u51c6\u5907\u3002",
      tone: "strategic"
    });

    expect(signals.decisionTopics).toContain("\u6d77\u5916\u53d1\u5c55");
    expect(signals.decisionTopics).toContain("\u804c\u4e1a\u53d1\u5c55");
    expect(signals.riskStyle).toBe("\u7a33\u5065\u8bd5\u63a2");
    expect(signals.preferredTone).toBe("\u7406\u6027\u7b56\u7565");
    expect(signals.sources).toEqual(["consult-1"]);
  });

  it("merges new signals without losing existing long-term topics", () => {
    const merged = mergeProfileMemorySignals(
      {
        decisionTopics: ["\u611f\u60c5\u5173\u7cfb"],
        riskStyle: "\u7a33\u5065\u8bd5\u63a2",
        preferredTone: "\u6e29\u67d4\u966a\u4f34",
        sources: ["consult-0"]
      },
      {
        decisionTopics: ["\u6d77\u5916\u53d1\u5c55", "\u611f\u60c5\u5173\u7cfb"],
        riskStyle: "\u7a33\u5065\u8bd5\u63a2",
        preferredTone: "\u7406\u6027\u7b56\u7565",
        sources: ["consult-1"]
      }
    );

    expect(merged.decisionTopics).toEqual(["\u611f\u60c5\u5173\u7cfb", "\u6d77\u5916\u53d1\u5c55"]);
    expect(merged.sources).toEqual(["consult-0", "consult-1"]);
    expect(merged.preferredTone).toBe("\u7406\u6027\u7b56\u7565");
  });
});
