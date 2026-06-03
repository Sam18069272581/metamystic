import { describe, expect, it } from "vitest";
import { formatConsultationCitationLine } from "./consultation-citation";

describe("formatConsultationCitationLine", () => {
  it("formats a citation with a readable classical source instead of an internal anchor", () => {
    const line = formatConsultationCitationLine(
      {
        id: "chunk-1",
        sourceTitle: "MetaMystic \u547d\u7406\u77e5\u8bc6\u5e93 MVP",
        anchorId: "pattern-shayin",
        content: "\u6740\u5370\u76f8\u751f\u5f3a\u8c03\u538b\u529b\u4e0e\u5b66\u4e60\u7cfb\u7edf\u4e4b\u95f4\u7684\u8f6c\u5316\u3002",
        metadata: {
          classicalSource: "\u300a\u5b50\u5e73\u771f\u8be0\u300b\u4e49\u7406\u6574\u7406",
          displayTitle: "\u6740\u5370\u76f8\u751f"
        },
        score: 0.42
      },
      0
    );

    expect(line).toBe(
      "1. [K1] \u300a\u5b50\u5e73\u771f\u8be0\u300b\u4e49\u7406\u6574\u7406\uff5c\u6740\u5370\u76f8\u751f\uff1a\u6740\u5370\u76f8\u751f\u5f3a\u8c03\u538b\u529b\u4e0e\u5b66\u4e60\u7cfb\u7edf\u4e4b\u95f4\u7684\u8f6c\u5316\u3002"
    );
    expect(line).not.toContain("#pattern-shayin");
  });
});
