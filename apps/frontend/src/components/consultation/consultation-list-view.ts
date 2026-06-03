import type { ConsultationDto } from "@metamystic/shared";

export interface ConsultationListItem {
  id: string;
  title: string;
  summary: string;
  statusLabel: string;
  toneLabel: string;
}

const statusLabels: Record<ConsultationDto["status"], string> = {
  pending: "\u7b49\u5f85\u4e2d",
  streaming: "\u63a8\u6f14\u4e2d",
  completed: "\u5df2\u5b8c\u6210",
  failed: "\u672a\u5b8c\u6210"
};

const toneLabels: Record<ConsultationDto["tone"], string> = {
  strategic: "\u7406\u6027\u7b56\u7565",
  gentle: "\u6e29\u67d4\u966a\u4f34"
};

export function buildConsultationListItems(consultations: ConsultationDto[]): ConsultationListItem[] {
  return consultations.map((consultation) => ({
    id: consultation.id,
    title: consultation.question,
    summary: consultation.summary?.trim() || "\u7b49\u5f85 AI \u56de\u590d\u6c89\u6dc0",
    statusLabel: statusLabels[consultation.status],
    toneLabel: toneLabels[consultation.tone]
  }));
}
