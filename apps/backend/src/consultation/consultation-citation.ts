import type { KnowledgeChunkDto } from "@metamystic/shared";

export function formatConsultationCitationLine(citation: KnowledgeChunkDto, index: number): string {
  const key = `K${index + 1}`;
  return `${index + 1}. [${key}] ${getCitationSource(citation)}\uff5c${getCitationTitle(citation)}\uff1a${citation.content}`;
}

export function getCitationSource(citation: KnowledgeChunkDto): string {
  return stringMetadata(citation, "classicalSource") ?? citation.sourceTitle;
}

export function getCitationTitle(citation: KnowledgeChunkDto): string {
  return stringMetadata(citation, "displayTitle") ?? stringMetadata(citation, "topicLabel") ?? "\u547d\u7406\u77e5\u8bc6";
}

function stringMetadata(citation: KnowledgeChunkDto, key: string): string | undefined {
  const value = citation.metadata[key];
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}
