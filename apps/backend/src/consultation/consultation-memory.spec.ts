import { describe, expect, it, vi } from "vitest";
import { ConsultationService } from "./consultation.service";

describe("ConsultationService memory integration", () => {
  it("updates profile memory after a stream completes", async () => {
    const now = new Date("2026-05-30T00:00:00.000Z");
    const consultation = {
      id: "consult-1",
      userId: "user-1",
      profileId: "profile-1",
      chartId: "chart-1",
      question: "\u6211\u9002\u5408\u53bb\u5fb7\u56fd\u53d1\u5c55\u5417\uff1f",
      tone: "strategic" as const,
      status: "pending" as const,
      summary: null,
      createdAt: now,
      chart: {
        id: "chart-1",
        profileId: "profile-1",
        dayMaster: "\u4e59\u6728",
        dayMasterStatus: "balanced",
        mainPattern: "\u6740\u5370\u76f8\u751f",
        pillars: {
          year: { stem: "\u4e59", branch: "\u4ea5", tenGod: "\u6bd4\u80a9", hiddenStems: [], nayin: "\u5c71\u5934\u706b" },
          month: { stem: "\u8f9b", branch: "\u5df3", tenGod: "\u4e03\u6740", hiddenStems: [], nayin: "\u767d\u8721\u91d1" },
          day: { stem: "\u4e59", branch: "\u536f", tenGod: "\u65e5\u4e3b", hiddenStems: [], nayin: "\u5927\u6eaa\u6c34" },
          hour: { stem: "\u8f9b", branch: "\u5df3", tenGod: "\u4e03\u6740", hiddenStems: [], nayin: "\u767d\u8721\u91d1" }
        },
        elements: { wood: 30, fire: 20, earth: 10, metal: 25, water: 15 },
        createdAt: now
      }
    };
    const prisma = {
      consultation: {
        findUnique: vi.fn().mockResolvedValue(consultation),
        update: vi.fn().mockResolvedValue({})
      },
      consultationMessage: {
        create: vi.fn().mockResolvedValue({})
      },
      $transaction: vi.fn(async (operations: unknown[]) => operations)
    };
    const safety = {
      evaluateQuestion: vi.fn().mockReturnValue({ allowed: true, disclaimer: "\u7406\u6027\u53c2\u8003" })
    };
    const knowledge = {
      search: vi.fn().mockResolvedValue({ chunks: [] })
    };
    const aiProvider = {
      async *streamConsultation() {
        yield { section: "verdict" as const, content: "\u9002\u5408\u5c0f\u6b65\u63a8\u8fdb" };
      }
    };
    const profileService = {
      rememberCompletedConsultation: vi.fn().mockResolvedValue({})
    };
    const service = new ConsultationService(
      prisma as never,
      safety as never,
      knowledge as never,
      aiProvider as never,
      profileService as never
    );

    await new Promise<void>((resolve, reject) => {
      service.streamConsultation("consult-1").subscribe({
        complete: resolve,
        error: reject
      });
    });

    expect(profileService.rememberCompletedConsultation).toHaveBeenCalledWith({
      profileId: "profile-1",
      consultationId: "consult-1",
      question: "\u6211\u9002\u5408\u53bb\u5fb7\u56fd\u53d1\u5c55\u5417\uff1f",
      answer: "\u9002\u5408\u5c0f\u6b65\u63a8\u8fdb",
      tone: "strategic"
    });
  });
});
