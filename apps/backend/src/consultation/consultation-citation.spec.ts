import { describe, expect, it } from "vitest";
import { formatConsultationCitationLine } from "./consultation-citation";

describe("formatConsultationCitationLine", () => {
  it("labels platform explanations without presenting them as classical originals", () => {
    const line = formatConsultationCitationLine({
      id: "platform-1",
      sourceTitle: "MetaMystic knowledge base",
      sourceType: "platform_explanation",
      reviewStatus: "published",
      anchorId: "career",
      content: "Decision guidance",
      score: 0.8,
      metadata: { referenceWork: "《滴天髓》" }
    }, 0);

    expect(line).toContain("[K1] \u5e73\u53f0\u89e3\u91ca");
    expect(line).not.toContain("\u300a\u6ef4\u5929\u9ad3\u300b");
  });

  it("formats a citation with a readable classical source instead of an internal anchor", () => {
    const line = formatConsultationCitationLine(
      {
        id: "chunk-1",
        sourceTitle: "MetaMystic \u547d\u7406\u77e5\u8bc6\u5e93 MVP",
        anchorId: "pattern-shayin",
        content: "\u6740\u5370\u76f8\u751f\u5f3a\u8c03\u538b\u529b\u4e0e\u5b66\u4e60\u7cfb\u7edf\u4e4b\u95f4\u7684\u8f6c\u5316\u3002",
        metadata: {
          sourceKind: "curatedCommentary",
          referenceWork: "\u300a\u5b50\u5e73\u771f\u8be0\u300b",
          displayTitle: "\u6740\u5370\u76f8\u751f"
        },
        score: 0.42
      },
      0
    );

    expect(line).toBe(
      "1. [K1] \u5e73\u53f0\u6574\u7406\uff08\u53c2\u8003\u300a\u5b50\u5e73\u771f\u8be0\u300b\uff09\uff5c\u6740\u5370\u76f8\u751f\uff1a\u6740\u5370\u76f8\u751f\u5f3a\u8c03\u538b\u529b\u4e0e\u5b66\u4e60\u7cfb\u7edf\u4e4b\u95f4\u7684\u8f6c\u5316\u3002"
    );
    expect(line).not.toContain("#pattern-shayin");
  });
});
