import { describe, expect, it, vi } from "vitest";
import { ConsultationService } from "./consultation.service";

const access = {
  mode: "public_beta" as const,
  charged: false,
  remaining: 29,
  resetsAt: "2026-07-14T00:00:00.000Z"
};

describe("ConsultationService public-beta access", () => {
  it("stores the free access snapshot when creating a consultation", async () => {
    const prisma = {
      profile: {
        findUnique: vi.fn().mockResolvedValue({
          id: "profile-1",
          userId: "user-1",
          user: { email: "user@example.com", anonymousUserId: null }
        })
      },
      baziChart: { findUnique: vi.fn().mockResolvedValue({ id: "chart-1", profileId: "profile-1" }) },
      consultation: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockImplementation(async ({ data }) => ({
          id: "consult-1",
          profileId: data.profileId,
          chartId: data.chartId,
          question: data.question,
          tone: data.tone,
          status: "pending",
          summary: null,
          locale: data.locale,
          accessMode: data.accessMode,
          charged: data.charged,
          accessRemaining: data.accessRemaining,
          accessResetsAt: data.accessResetsAt,
          createdAt: new Date("2026-07-13T10:15:30.000Z")
        }))
      }
    };
    const policy = { assertAvailable: vi.fn().mockResolvedValue(access), consume: vi.fn() };
    const service = new ConsultationService(
      prisma as never,
      { evaluateQuestion: vi.fn().mockReturnValue({ allowed: true, disclaimer: "Reference only" }) } as never,
      {} as never,
      {} as never,
      {} as never,
      policy as never
    );

    const result = await service.createUserConsultation("user-1", {
      profileId: "profile-1",
      chartId: "chart-1",
      question: "我适合在德国继续发展吗？",
      tone: "strategic",
      locale: "zh"
    });

    expect(policy.assertAvailable).toHaveBeenCalledWith({ userId: "user-1", ownerType: "user" });
    expect(prisma.consultation.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        locale: "zh",
        accessMode: "public_beta",
        charged: false,
        accessRemaining: 29,
        accessResetsAt: new Date(access.resetsAt)
      })
    }));
    expect(result.access).toEqual(access);
  });
});
