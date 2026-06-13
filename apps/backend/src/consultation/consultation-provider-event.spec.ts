import type { MessageEvent } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { ConsultationService } from "./consultation.service";

describe("ConsultationService provider stream events", () => {
  it("emits provider status events before content chunks", async () => {
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
          year: { stem: "\u4e59", branch: "\u4ea5", tenGod: "\u6bd4\u80a9", hiddenStems: [] },
          month: { stem: "\u8f9b", branch: "\u5df3", tenGod: "\u4e03\u6740", hiddenStems: [] },
          day: { stem: "\u4e59", branch: "\u536f", tenGod: "\u65e5\u4e3b", hiddenStems: [] },
          hour: { stem: "\u8f9b", branch: "\u5df3", tenGod: "\u4e03\u6740", hiddenStems: [] }
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
        yield {
          type: "provider" as const,
          providerName: "mock",
          model: "rule-based",
          status: "fallback" as const,
          isFallback: true,
          failedProviderName: "openai",
          reason: "OpenAI unavailable",
          durationMs: 42
        };
        yield { section: "verdict" as const, content: "\u9002\u5408\u5c0f\u6b65\u63a8\u8fdb" };
      }
    };
    const service = new ConsultationService(
      prisma as never,
      safety as never,
      knowledge as never,
      aiProvider as never,
      { rememberCompletedConsultation: vi.fn().mockResolvedValue({}) } as never
    );
    const events: MessageEvent[] = [];

    await new Promise<void>((resolve, reject) => {
      service.streamConsultation("consult-1").subscribe({
        next: (event) => events.push(event),
        complete: resolve,
        error: reject
      });
    });

    expect(events.map((event) => event.data)).toEqual([
      {
        type: "provider",
        consultationId: "consult-1",
        providerName: "mock",
        model: "rule-based",
        status: "fallback",
        isFallback: true,
        failedProviderName: "openai",
        reason: "OpenAI unavailable",
        durationMs: 42
      },
      {
        type: "chunk",
        consultationId: "consult-1",
        section: "verdict",
        content: "\u9002\u5408\u5c0f\u6b65\u63a8\u8fdb"
      },
      { type: "done", consultationId: "consult-1" }
    ]);
  });
});
