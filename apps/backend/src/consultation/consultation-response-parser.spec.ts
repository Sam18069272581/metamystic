import { describe, expect, it } from "vitest";
import { parseConsultationResponseSections } from "./consultation-response-parser";

describe("parseConsultationResponseSections", () => {
  it("parses markdown headings into stream sections", () => {
    const sections = parseConsultationResponseSections(`
## \u7ed3\u8bba
\u9002\u5408\u7a33\u6001\u63a8\u8fdb\u3002

## \u547d\u7406\u903b\u8f91
\u4f9d\u636e\u6740\u5370\u76f8\u751f\u3002

## \u547d\u76d8\u89e6\u53d1\u70b9
\u65e5\u4e3b\u504f\u5f31\uff0c\u4e03\u6740\u548c\u5370\u661f\u662f\u672c\u6b21\u5224\u65ad\u7684\u4e3b\u8981\u56e0\u7d20\u3002

## \u73b0\u5b9e\u5efa\u8bae
\u5148\u505a\u5c0f\u89c4\u6a21\u9a8c\u8bc1\u3002

## \u53c2\u8003\u4f9d\u636e
[K1] pattern-shayin

## \u514d\u8d23\u58f0\u660e
\u4ec5\u4f9b\u53c2\u8003\u3002
`);

    expect(sections).toEqual([
      { section: "verdict", content: "\u9002\u5408\u7a33\u6001\u63a8\u8fdb\u3002" },
      { section: "logic", content: "\u4f9d\u636e\u6740\u5370\u76f8\u751f\u3002" },
      { section: "factors", content: "\u65e5\u4e3b\u504f\u5f31\uff0c\u4e03\u6740\u548c\u5370\u661f\u662f\u672c\u6b21\u5224\u65ad\u7684\u4e3b\u8981\u56e0\u7d20\u3002" },
      { section: "advice", content: "\u5148\u505a\u5c0f\u89c4\u6a21\u9a8c\u8bc1\u3002" },
      { section: "citation", content: "[K1] pattern-shayin" },
      { section: "disclaimer", content: "\u4ec5\u4f9b\u53c2\u8003\u3002" }
    ]);
  });

  it("falls back to verdict when headings are missing", () => {
    expect(parseConsultationResponseSections("\u6574\u4f53\u770b\u9002\u5408\u5148\u9a8c\u8bc1\u3002")).toEqual([
      { section: "verdict", content: "\u6574\u4f53\u770b\u9002\u5408\u5148\u9a8c\u8bc1\u3002" }
    ]);
  });
});
