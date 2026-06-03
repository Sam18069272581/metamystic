import type { ConsultationDto } from "@metamystic/shared";
import { describe, expect, it } from "vitest";
import { buildConsultationListItems } from "./consultation-list-view";

describe("buildConsultationListItems", () => {
  it("creates compact recent consultation items", () => {
    const consultations: ConsultationDto[] = [
      {
        id: "consult-1",
        profileId: "profile-1",
        chartId: "chart-1",
        question: "\u6211\u9002\u5408\u53bb\u5fb7\u56fd\u5417\uff1f",
        tone: "strategic",
        status: "completed",
        summary: "\u9002\u5408\u5c0f\u6b65\u63a8\u8fdb",
        createdAt: "2026-05-30T10:00:00.000Z"
      }
    ];

    const items = buildConsultationListItems(consultations);

    expect(items[0]).toEqual({
      id: "consult-1",
      title: "\u6211\u9002\u5408\u53bb\u5fb7\u56fd\u5417\uff1f",
      summary: "\u9002\u5408\u5c0f\u6b65\u63a8\u8fdb",
      statusLabel: "\u5df2\u5b8c\u6210",
      toneLabel: "\u7406\u6027\u7b56\u7565"
    });
  });
});
