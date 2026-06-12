import { describe, expect, it } from "vitest";
import { buildConsultationPrompt } from "./consultation-prompt";

describe("buildConsultationPrompt", () => {
  it("injects readable RAG sources without internal anchors", () => {
    const prompt = buildConsultationPrompt({
      question: "\u6211\u9002\u5408\u53bb\u5fb7\u56fd\u53d1\u5c55\u5417\uff1f",
      tone: "strategic",
      chart: {
        id: "chart-1",
        profileId: "profile-1",
        dayMaster: "\u4e59",
        dayMasterStatus: "weak",
        mainPattern: "\u6740\u5370\u76f8\u751f",
        pillars: {
          year: { stem: "\u4e59", branch: "\u4ea5", tenGod: "\u6bd4\u80a9", hiddenStems: ["\u58ec"], shensha: ["\u9a7f\u9a6c"] },
          month: { stem: "\u8f9b", branch: "\u5df3", tenGod: "\u4e03\u6740", hiddenStems: ["\u4e19"], shensha: ["\u5929\u4e59\u8d35\u4eba", "\u5929\u5fb7\u8d35\u4eba"] },
          day: { stem: "\u4e59", branch: "\u536f", tenGod: "\u65e5\u4e3b", hiddenStems: ["\u4e59"], shensha: ["\u5c06\u661f", "\u7a7a\u4ea1"] },
          hour: { stem: "\u8f9b", branch: "\u5df3", tenGod: "\u4e03\u6740", hiddenStems: ["\u4e19"], shensha: ["\u9a7f\u9a6c"] }
        },
        elements: { wood: 0.32, fire: 0.22, earth: 0.15, metal: 0.2, water: 0.11 },
        createdAt: "2026-05-29T00:00:00.000Z"
      },
      citations: [
        {
          id: "chunk-1",
          sourceTitle: "MetaMystic \u547d\u7406\u77e5\u8bc6\u5e93 MVP",
          anchorId: "pattern-shayin",
          content: "\u6740\u5370\u76f8\u751f\u5f3a\u8c03\u538b\u529b\u4e0e\u5b66\u4e60\u7cfb\u7edf\u4e4b\u95f4\u7684\u8f6c\u5316\u3002",
          metadata: {
            tags: ["\u6740\u5370\u76f8\u751f"],
            topic: "study_abroad",
            classicalSource: "\u300a\u5b50\u5e73\u771f\u8be0\u300b\u4e49\u7406\u6574\u7406",
            displayTitle: "\u6740\u5370\u76f8\u751f"
          },
          score: 0.42
        }
      ],
      disclaimer: "\u4ec5\u4f9b\u53c2\u8003\uff0c\u4e0d\u66ff\u4ee3\u4e13\u4e1a\u5efa\u8bae\u3002"
    });

    expect(prompt.system).toContain("\u5fc5\u987b\u4f18\u5148\u4f7f\u7528\u3010RAG \u77e5\u8bc6\u4f9d\u636e\u3011");
    expect(prompt.user).toContain("[K1] \u300a\u5b50\u5e73\u771f\u8be0\u300b\u4e49\u7406\u6574\u7406\uff5c\u6740\u5370\u76f8\u751f");
    expect(prompt.user).not.toContain("#pattern-shayin");
    expect(prompt.user).toContain("\u3010\u795e\u715e\u8f85\u52a9\u89e3\u8bfb\u3011");
    expect(prompt.user).toContain("\u6708\u67f1\uff1a\u5929\u4e59\u8d35\u4eba\uff5c\u8d35\u4eba\uff5c\u9047\u4e8b\u8f83\u6613\u5f97\u5173\u952e\u52a9\u529b");
    expect(prompt.user).toContain("\u65e5\u67f1\uff1a\u7a7a\u4ea1\uff5c\u98ce\u9669\uff5c\u4e8b\u60c5\u5bb9\u6613\u865a\u3001\u7a7a\u3001\u843d\u7a7a");
    expect(prompt.user).toContain("\u6211\u9002\u5408\u53bb\u5fb7\u56fd\u53d1\u5c55\u5417\uff1f");
    expect(prompt.user).toContain("\u4ec5\u4f9b\u53c2\u8003\uff0c\u4e0d\u66ff\u4ee3\u4e13\u4e1a\u5efa\u8bae\u3002");
  });
});
