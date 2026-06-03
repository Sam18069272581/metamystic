import type { ConsultationHistoryDto } from "@metamystic/shared";

export interface ConsultationHistoryView {
  latestQuestion: string;
  assistantPreview: string;
  messageCount: number;
  statusLabel: string;
}

const statusLabels: Record<ConsultationHistoryDto["consultation"]["status"], string> = {
  pending: "\u7b49\u5f85\u4e2d",
  streaming: "\u63a8\u6f14\u4e2d",
  completed: "\u5df2\u5b8c\u6210",
  failed: "\u672a\u5b8c\u6210"
};

export function buildConsultationHistoryView(history: ConsultationHistoryDto): ConsultationHistoryView {
  const assistantMessage = [...history.messages].reverse().find((message) => message.role === "assistant");

  return {
    latestQuestion: history.consultation.question,
    assistantPreview: compactPreview(assistantMessage?.content ?? history.consultation.summary ?? ""),
    messageCount: history.messages.length,
    statusLabel: statusLabels[history.consultation.status]
  };
}

function compactPreview(content: string): string {
  const normalized = content.replace(/\s+/g, " ").trim();
  if (normalized.length <= 96) {
    return normalized;
  }
  return `${normalized.slice(0, 96)}...`;
}
