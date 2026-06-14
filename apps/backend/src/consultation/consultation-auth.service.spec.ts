import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { ConsultationService } from "./consultation.service";

describe("ConsultationService authenticated creation", () => {
  it("rejects creating a consultation for another user's profile", async () => {
    const prisma = {
      profile: {
        findUnique: vi.fn().mockResolvedValue({ id: "profile-1", userId: "other-user" })
      }
    };
    const service = new ConsultationService(
      prisma as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never
    );

    await expect(
      service.createUserConsultation("user-1", {
        profileId: "profile-1",
        chartId: "chart-1",
        question: "\u6211\u9002\u5408\u53bb\u5fb7\u56fd\u5417\uff1f",
        tone: "strategic"
      })
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("returns consultation history only when it belongs to the current user", async () => {
    const prisma = {
      consultation: {
        findFirst: vi.fn().mockResolvedValue({
          id: "consult-1",
          userId: "user-1",
          profileId: "profile-1",
          chartId: "chart-1",
          question: "\u6211\u9002\u5408\u53bb\u5fb7\u56fd\u5417\uff1f",
          tone: "strategic",
          status: "completed",
          summary: "\u9002\u5408\u5c0f\u6b65\u63a8\u8fdb",
          createdAt: new Date("2026-06-02T00:00:00.000Z"),
          messages: [
            {
              id: "msg-1",
              consultationId: "consult-1",
              role: "user",
              content: "\u6211\u9002\u5408\u53bb\u5fb7\u56fd\u5417\uff1f",
              createdAt: new Date("2026-06-02T00:00:00.000Z")
            }
          ]
        })
      }
    };
    const service = new ConsultationService(
      prisma as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never
    );

    const history = await service.getUserHistory("user-1", "consult-1");

    expect(history.consultation.id).toBe("consult-1");
    expect(history.messages).toHaveLength(1);
    expect(prisma.consultation.findFirst).toHaveBeenCalledWith({
      where: { id: "consult-1", userId: "user-1" },
      include: { messages: { orderBy: { createdAt: "asc" } } }
    });
  });

  it("hides consultation history that does not belong to the current user", async () => {
    const service = new ConsultationService(
      {
        consultation: {
          findFirst: vi.fn().mockResolvedValue(null)
        }
      } as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never
    );

    await expect(service.getUserHistory("user-1", "other-consult")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("does not expose authenticated consultation history through the public history lookup", async () => {
    const service = new ConsultationService(
      {
        consultation: {
          findUnique: vi.fn().mockResolvedValue({
            id: "consult-1",
            userId: "user-1",
            profileId: "profile-1",
            chartId: "chart-1",
            question: "\u6211\u9002\u5408\u53bb\u5fb7\u56fd\u5417\uff1f",
            tone: "strategic",
            status: "completed",
            summary: "\u9002\u5408\u5c0f\u6b65\u63a8\u8fdb",
            createdAt: new Date("2026-06-02T00:00:00.000Z"),
            messages: []
          })
        }
      } as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never
    );

    await expect(service.getHistory("consult-1")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("does not run the public stream for a registered user's consultation", async () => {
    const aiProvider = {
      streamConsultation: vi.fn(async function* () {
        yield { section: "verdict" as const, content: "\u4e0d\u5e94\u8be5\u88ab\u6267\u884c" };
      })
    };
    const service = new ConsultationService(
      {
        consultation: {
          findUnique: vi.fn().mockResolvedValue({
            id: "consult-1",
            userId: "user-1",
            profileId: "profile-1",
            chartId: "chart-1",
            question: "\u6211\u9002\u5408\u53bb\u5fb7\u56fd\u5417\uff1f",
            tone: "strategic",
            status: "pending",
            summary: null,
            createdAt: new Date("2026-06-02T00:00:00.000Z"),
            user: { anonymousUserId: null, email: "user@example.com" },
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
              createdAt: new Date("2026-06-02T00:00:00.000Z")
            }
          }),
          update: vi.fn().mockResolvedValue({})
        }
      } as never,
      { evaluateQuestion: vi.fn().mockReturnValue({ allowed: true, disclaimer: "\u7406\u6027\u53c2\u8003" }) } as never,
      { search: vi.fn().mockResolvedValue({ chunks: [] }) } as never,
      aiProvider as never,
      {} as never
    );
    const events: unknown[] = [];

    await new Promise<void>((resolve, reject) => {
      service.streamConsultation("consult-1").subscribe({
        next: (event) => events.push(event.data),
        complete: resolve,
        error: reject
      });
    });

    expect(aiProvider.streamConsultation).not.toHaveBeenCalled();
    expect(events).toContainEqual({
      type: "error",
      consultationId: "consult-1",
      message: "Consultation not found"
    });
  });

  it("runs the authenticated stream only for the owning user", async () => {
    const now = new Date("2026-06-02T00:00:00.000Z");
    const consultation = {
      id: "consult-1",
      userId: "user-1",
      profileId: "profile-1",
      chartId: "chart-1",
      question: "\u6211\u9002\u5408\u53bb\u5fb7\u56fd\u5417\uff1f",
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
        findFirst: vi.fn().mockResolvedValue(consultation),
        update: vi.fn().mockResolvedValue({})
      },
      consultationMessage: {
        create: vi.fn().mockResolvedValue({})
      },
      $transaction: vi.fn(async (operations: unknown[]) => operations)
    };
    const service = new ConsultationService(
      prisma as never,
      { evaluateQuestion: vi.fn().mockReturnValue({ allowed: true, disclaimer: "\u7406\u6027\u53c2\u8003" }) } as never,
      { search: vi.fn().mockResolvedValue({ chunks: [] }) } as never,
      {
        async *streamConsultation() {
          yield { section: "verdict" as const, content: "\u9002\u5408\u5c0f\u6b65\u63a8\u8fdb" };
        }
      } as never,
      { rememberCompletedConsultation: vi.fn().mockResolvedValue({}) } as never
    );
    const events: unknown[] = [];

    await new Promise<void>((resolve, reject) => {
      service.streamUserConsultation("user-1", "consult-1").subscribe({
        next: (event) => events.push(event.data),
        complete: resolve,
        error: reject
      });
    });

    expect(prisma.consultation.findFirst).toHaveBeenCalledWith({
      where: { id: "consult-1", userId: "user-1" },
      include: { chart: true }
    });
    expect(events).toContainEqual({ type: "done", consultationId: "consult-1" });
  });
});
