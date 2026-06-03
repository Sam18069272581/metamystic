import { describe, expect, it } from "vitest";
import { parseCitationContent } from "./citation-parser";

describe("parseCitationContent", () => {
  it("parses numbered RAG citation lines into user-facing source cards", () => {
    const citations = parseCitationContent(
      "1. [K1] \u300a\u5b50\u5e73\u771f\u8be0\u300b\u4e49\u7406\u6574\u7406\uff5c\u6740\u5370\u76f8\u751f\uff1a\u6740\u5370\u76f8\u751f\u5f3a\u8c03\u538b\u529b\u4e0e\u5b66\u4e60\u7cfb\u7edf\u4e4b\u95f4\u7684\u8f6c\u5316\u3002\n2. [K2] \u300a\u6ef4\u5929\u9ad3\u300b\u4e49\u7406\u6574\u7406\uff5c\u98ce\u63a7\u8fb9\u754c\uff1a\u547d\u7406\u5206\u6790\u9002\u5408\u4f5c\u4e3a\u81ea\u6211\u89c2\u5bdf\u3002"
    );

    expect(citations).toEqual([
      {
        index: 1,
        key: "K1",
        sourceTitle: "\u300a\u5b50\u5e73\u771f\u8be0\u300b\u4e49\u7406\u6574\u7406",
        topicLabel: "\u6740\u5370\u76f8\u751f",
        content: "\u6740\u5370\u76f8\u751f\u5f3a\u8c03\u538b\u529b\u4e0e\u5b66\u4e60\u7cfb\u7edf\u4e4b\u95f4\u7684\u8f6c\u5316\u3002"
      },
      {
        index: 2,
        key: "K2",
        sourceTitle: "\u300a\u6ef4\u5929\u9ad3\u300b\u4e49\u7406\u6574\u7406",
        topicLabel: "\u98ce\u63a7\u8fb9\u754c",
        content: "\u547d\u7406\u5206\u6790\u9002\u5408\u4f5c\u4e3a\u81ea\u6211\u89c2\u5bdf\u3002"
      }
    ]);
  });

  it("falls back to a single readable citation when the stream is plain text", () => {
    const citations = parseCitationContent("\u5f53\u524d\u95ee\u9898\u6ca1\u6709\u547d\u4e2d\u660e\u786e\u77e5\u8bc6\u7247\u6bb5\u3002");

    expect(citations).toEqual([
      {
        index: 1,
        key: "K1",
        sourceTitle: "\u77e5\u8bc6\u5e93",
        topicLabel: "\u672a\u547d\u4e2d\u660e\u786e\u7247\u6bb5",
        content: "\u5f53\u524d\u95ee\u9898\u6ca1\u6709\u547d\u4e2d\u660e\u786e\u77e5\u8bc6\u7247\u6bb5\u3002"
      }
    ]);
  });
});
