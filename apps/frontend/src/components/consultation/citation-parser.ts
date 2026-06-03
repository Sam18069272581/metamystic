export interface ParsedCitation {
  index: number;
  key: string;
  sourceTitle: string;
  topicLabel: string;
  content: string;
}

const citationPattern = /^(\d+)\.\s+(?:\[(K\d+)\]\s+)?(.+?)\s*[｜|]\s*([^：:]+)[：:](.+)$/;

export function parseCitationContent(content: string): ParsedCitation[] {
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const parsed = lines
    .map((line): ParsedCitation | undefined => {
      const match = citationPattern.exec(line);
      if (!match) {
        return undefined;
      }
      const index = Number(match[1]);
      return {
        index,
        key: match[2]?.trim() ?? `K${index}`,
        sourceTitle: match[3]?.trim() ?? "\u77e5\u8bc6\u5e93",
        topicLabel: match[4]?.trim() ?? "\u547d\u7406\u77e5\u8bc6",
        content: match[5]?.trim() ?? ""
      };
    })
    .filter((citation): citation is ParsedCitation => Boolean(citation));

  if (parsed.length > 0) {
    return parsed;
  }

  const fallback = content.trim();
  return fallback
    ? [
        {
          index: 1,
          key: "K1",
          sourceTitle: "\u77e5\u8bc6\u5e93",
          topicLabel: "\u672a\u547d\u4e2d\u660e\u786e\u7247\u6bb5",
          content: fallback
        }
      ]
    : [];
}
