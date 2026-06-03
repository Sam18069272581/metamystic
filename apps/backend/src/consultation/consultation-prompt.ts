import type { BaziChartDto, ConsultationTone, KnowledgeChunkDto } from "@metamystic/shared";
import { getCitationSource, getCitationTitle } from "./consultation-citation";

export interface ConsultationPromptInput {
  question: string;
  tone: ConsultationTone;
  chart: BaziChartDto;
  citations: KnowledgeChunkDto[];
  disclaimer: string;
}

export interface ConsultationPrompt {
  system: string;
  user: string;
}

export function buildConsultationPrompt(input: ConsultationPromptInput): ConsultationPrompt {
  const toneRule =
    input.tone === "gentle"
      ? "\u8bed\u6c14\u6e29\u548c\u3001\u966a\u4f34\u611f\u5f3a\uff0c\u4f46\u4e0d\u8981\u56de\u907f\u5173\u952e\u98ce\u9669\u3002"
      : "\u8bed\u6c14\u76f4\u63a5\u3001\u7b56\u7565\u5316\uff0c\u4f18\u5148\u7ed9\u7ed3\u8bba\u548c\u884c\u52a8\u987a\u5e8f\u3002";

  return {
    system: [
      "\u4f60\u662f MetaMystic \u7684 AI \u547d\u7406\u51b3\u7b56\u987e\u95ee\uff0c\u804c\u8d23\u662f\u63d0\u4f9b\u7384\u5b66\u89c6\u89d2\u4e0b\u7684\u4eba\u751f\u51b3\u7b56\u8f85\u52a9\u3002",
      "\u5fc5\u987b\u4f18\u5148\u4f7f\u7528\u3010RAG \u77e5\u8bc6\u4f9d\u636e\u3011\u4e0e\u3010\u516b\u5b57\u6392\u76d8\u6458\u8981\u3011\u8fdb\u884c\u5206\u6790\uff1b\u6ca1\u6709\u4f9d\u636e\u65f6\u8981\u660e\u786e\u8bf4\u662f\u63a8\u65ad\u3002",
      "\u7981\u6b62\u7edd\u5bf9\u5316\u65ad\u8bed\uff0c\u7981\u6b62\u627f\u8bfa\u7ed3\u679c\uff0c\u7981\u6b62\u66ff\u4ee3\u533b\u7597\u3001\u6cd5\u5f8b\u3001\u8d22\u52a1\u7b49\u4e13\u4e1a\u5efa\u8bae\u3002",
      "\u8f93\u51fa\u5fc5\u987b\u5206\u4e3a\uff1a\u7ed3\u8bba\u3001\u547d\u7406\u903b\u8f91\u3001\u73b0\u5b9e\u5efa\u8bae\u3001\u53c2\u8003\u4f9d\u636e\u3001\u514d\u8d23\u58f0\u660e\u3002",
      toneRule
    ].join("\n"),
    user: [
      "\u3010\u7528\u6237\u95ee\u9898\u3011",
      input.question,
      "",
      "\u3010\u516b\u5b57\u6392\u76d8\u6458\u8981\u3011",
      `\u65e5\u4e3b\uff1a${input.chart.dayMaster}`,
      `\u65e5\u4e3b\u72b6\u6001\uff1a${input.chart.dayMasterStatus}`,
      `\u4e3b\u683c\u5c40\uff1a${input.chart.mainPattern}`,
      `\u56db\u67f1\uff1a${formatPillars(input.chart.pillars)}`,
      `\u4e94\u884c\u5206\u5e03\uff1a${formatElements(input.chart.elements)}`,
      "",
      "\u3010RAG \u77e5\u8bc6\u4f9d\u636e\u3011",
      formatCitations(input.citations),
      "",
      "\u3010\u5b89\u5168\u8fb9\u754c\u3011",
      input.disclaimer
    ].join("\n")
  };
}

function formatCitations(citations: KnowledgeChunkDto[]): string {
  if (citations.length === 0) {
    return "\u672a\u68c0\u7d22\u5230\u9ad8\u76f8\u5173\u77e5\u8bc6\u7247\u6bb5\u3002\u56de\u7b54\u65f6\u53ea\u80fd\u57fa\u4e8e\u547d\u76d8\u6458\u8981\u505a\u4fdd\u5b88\u63a8\u65ad\uff0c\u5e76\u8bf4\u660e\u4f9d\u636e\u4e0d\u8db3\u3002";
  }

  return citations
    .map((citation, index) => {
      const tags = Array.isArray(citation.metadata.tags) ? citation.metadata.tags.join("\u3001") : "";
      return [
        `[K${index + 1}] ${getCitationSource(citation)}\uff5c${getCitationTitle(citation)}`,
        `\u4e3b\u9898\uff1a${String(citation.metadata.topic ?? "unknown")}`,
        tags ? `\u6807\u7b7e\uff1a${tags}` : undefined,
        `\u5185\u5bb9\uff1a${citation.content}`
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");
}

function formatPillars(pillars: BaziChartDto["pillars"]): string {
  return [
    `\u5e74\u67f1${pillars.year.stem}${pillars.year.branch}`,
    `\u6708\u67f1${pillars.month.stem}${pillars.month.branch}`,
    `\u65e5\u67f1${pillars.day.stem}${pillars.day.branch}`,
    `\u65f6\u67f1${pillars.hour.stem}${pillars.hour.branch}`
  ].join("\uff0c");
}

function formatElements(elements: BaziChartDto["elements"]): string {
  return Object.entries(elements)
    .map(([element, value]) => `${element}:${Math.round(value * 100)}%`)
    .join("\uff0c");
}
