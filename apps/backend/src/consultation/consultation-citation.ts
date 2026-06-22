import type { KnowledgeChunkDto } from "@metamystic/shared";

export function formatConsultationCitationLine(citation: KnowledgeChunkDto, index: number): string {
  const key = `K${index + 1}`;
  return `${index + 1}. [${key}] ${getCitationSource(citation)}\uff5c${getCitationTitle(citation)}\uff1a${citation.content}`;
}

export function getCitationSource(citation: KnowledgeChunkDto): string {
  const sourceKind = stringMetadata(citation, "sourceKind");
  const referenceWork = stringMetadata(citation, "referenceWork");
  if (sourceKind === "curatedCommentary") {
    return referenceWork ? `\u5e73\u53f0\u6574\u7406\uff08\u53c2\u8003${referenceWork}\uff09` : "\u5e73\u53f0\u6574\u7406";
  }
  if (sourceKind === "primaryText") {
    return referenceWork ?? citation.sourceTitle;
  }
  return citation.sourceTitle;
}

export function getCitationTitle(citation: KnowledgeChunkDto): string {
  return stringMetadata(citation, "displayTitle") ?? stringMetadata(citation, "topicLabel") ?? "\u547d\u7406\u77e5\u8bc6";
}

function stringMetadata(citation: KnowledgeChunkDto, key: string): string | undefined {
  const value = citation.metadata[key];
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}
