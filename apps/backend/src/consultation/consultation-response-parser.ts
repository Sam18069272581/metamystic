import type { AiSectionType } from "@metamystic/shared";
import type { AiProviderChunk } from "./ai-provider";

const headingToSection: Array<[RegExp, AiSectionType]> = [
  [/^#{1,3}\s*\u7ed3\u8bba\s*$/m, "verdict"],
  [/^#{1,3}\s*\u547d\u7406\u903b\u8f91\s*$/m, "logic"],
  [/^#{1,3}\s*\u547d\u76d8\u89e6\u53d1\u70b9\s*$/m, "factors"],
  [/^#{1,3}\s*\u73b0\u5b9e\u5efa\u8bae\s*$/m, "advice"],
  [/^#{1,3}\s*\u53c2\u8003\u4f9d\u636e\s*$/m, "citation"],
  [/^#{1,3}\s*\u514d\u8d23\u58f0\u660e\s*$/m, "disclaimer"]
];

export function parseConsultationResponseSections(content: string): AiProviderChunk[] {
  const normalized = content.trim();

  if (!normalized) {
    return [];
  }

  const matches = headingToSection
    .flatMap(([pattern, section]) => {
      const match = pattern.exec(normalized);
      return match?.index === undefined ? [] : [{ section, index: match.index, heading: match[0] }];
    })
    .sort((left, right) => left.index - right.index);

  if (matches.length === 0) {
    return [{ section: "verdict", content: normalized }];
  }

  return matches
    .map((match, index) => {
      const start = match.index + match.heading.length;
      const end = matches[index + 1]?.index ?? normalized.length;
      return {
        section: match.section,
        content: normalized.slice(start, end).trim()
      };
    })
    .filter((chunk) => chunk.content.length > 0);
}
