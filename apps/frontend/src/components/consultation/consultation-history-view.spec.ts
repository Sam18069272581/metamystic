import type { ConsultationHistoryDto } from "@metamystic/shared";
import { describe, expect, it } from "vitest";
import { buildConsultationHistoryView } from "./consultation-history-view";

const history: ConsultationHistoryDto = {
  consultation: {
    id: "consult-1",
    profileId: "profile-1",
    chartId: "chart-1",
    question: "\u6211\u9002\u5408\u53bb\u5fb7\u56fd\u5417\uff1f",
    tone: "strategic",
    status: "completed",
    createdAt: "2026-05-30T00:00:00.000Z"
  },
  messages: [
    {
      id: "message-user",
      consultationId: "consult-1",
      role: "user",
      content: "\u6211\u9002\u5408\u53bb\u5fb7\u56fd\u5417\uff1f",
      createdAt: "2026-05-30T00:00:00.000Z"
    },
    {
      id: "message-assistant",
      consultationId: "consult-1",
      role: "assistant",
      content: "\u7ed3\u8bba\uff1a\u9002\u5408\uff0c\u4f46\u5efa\u8bae\u5148\u505a\u8bed\u8a00\u548c\u804c\u4e1a\u8def\u5f84\u9a8c\u8bc1\u3002",
      createdAt: "2026-05-30T00:00:01.000Z"
    }
  ]
};

describe("buildConsultationHistoryView", () => {
  it("extracts a compact latest consultation summary", () => {
    const view = buildConsultationHistoryView(history);

    expect(view.latestQuestion).toBe("\u6211\u9002\u5408\u53bb\u5fb7\u56fd\u5417\uff1f");
    expect(view.assistantPreview).toContain("\u9002\u5408");
    expect(view.messageCount).toBe(2);
  });
});
