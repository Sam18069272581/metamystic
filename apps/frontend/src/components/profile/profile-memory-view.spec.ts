import type { ProfileMemorySignalsDto } from "@metamystic/shared";
import { describe, expect, it } from "vitest";
import { buildProfileMemoryView } from "./profile-memory-view";

describe("buildProfileMemoryView", () => {
  it("formats memory signals for a compact profile panel", () => {
    const memory: ProfileMemorySignalsDto = {
      decisionTopics: ["\u6d77\u5916\u53d1\u5c55", "\u804c\u4e1a\u53d1\u5c55"],
      riskStyle: "\u7a33\u5065\u8bd5\u63a2",
      preferredTone: "\u7406\u6027\u7b56\u7565",
      sources: ["consult-1", "consult-2"]
    };

    const view = buildProfileMemoryView(memory);

    expect(view.topicText).toBe("\u6d77\u5916\u53d1\u5c55 / \u804c\u4e1a\u53d1\u5c55");
    expect(view.sourceText).toBe("2 \u6b21\u54a8\u8be2\u6c89\u6dc0");
  });
});
