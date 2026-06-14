import { describe, expect, it, vi } from "vitest";
import { ConsultationService } from "./consultation.service";

describe("ConsultationService listRecentByProfile", () => {
  it("does not expose user-owned consultations through the public profile list", async () => {
    const prisma = {
      consultation: {
        findMany: vi.fn()
      }
    };
    const service = new ConsultationService(
      prisma as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never
    );

    const result = await service.listRecentByProfile("profile-1");

    expect(prisma.consultation.findMany).not.toHaveBeenCalled();
    expect(result.profileId).toBe("profile-1");
    expect(result.consultations).toEqual([]);
  });

  it("returns recent consultations for a profile owned by the current user", async () => {
    const prisma = {
      profile: {
        findFirst: vi.fn().mockResolvedValue({ id: "profile-1", userId: "user-1" })
      },
      consultation: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "consult-user",
            profileId: "profile-1",
            chartId: "chart-1",
            question: "\u6211\u9002\u5408\u6362\u5de5\u4f5c\u5417\uff1f",
            tone: "strategic",
            status: "completed",
            summary: "\u53ef\u4ee5\u5148\u505a\u4f4e\u98ce\u9669\u63a2\u7d22",
            createdAt: new Date("2026-05-30T10:00:00.000Z")
          }
        ])
      }
    };
    const service = new ConsultationService(
      prisma as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never
    );

    const result = await service.listUserRecentByProfile("user-1", "profile-1");

    expect(prisma.profile.findFirst).toHaveBeenCalledWith({
      where: { id: "profile-1", userId: "user-1" },
      select: { id: true }
    });
    expect(prisma.consultation.findMany).toHaveBeenCalledWith({
      where: { profileId: "profile-1", userId: "user-1" },
      orderBy: { createdAt: "desc" },
      take: 10
    });
    expect(result.consultations.map((item) => item.id)).toEqual(["consult-user"]);
  });
});
