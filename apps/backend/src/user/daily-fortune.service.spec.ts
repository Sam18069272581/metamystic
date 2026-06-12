import { describe, expect, it, vi } from "vitest";
import { DailyFortuneService } from "./daily-fortune.service";

describe("DailyFortuneService", () => {
  it("builds a personalized daily fortune from the default profile and latest Bazi chart", async () => {
    const prisma = {
      profile: {
        findFirst: vi.fn().mockResolvedValue({
          id: "profile-1",
          label: "自己",
          isDefault: true,
          createdAt: new Date("2026-06-01T00:00:00.000Z")
        })
      },
      baziChart: {
        findFirst: vi.fn().mockResolvedValue({
          id: "bazi-1",
          dayMaster: "乙",
          dayMasterStatus: "weak",
          mainPattern: "杀印相生",
          elements: { wood: 0.2, fire: 0.1, earth: 0.15, metal: 0.2, water: 0.35 },
          metadata: { usefulGods: ["water"], unfavorableGods: ["metal"] },
          createdAt: new Date("2026-06-10T00:00:00.000Z")
        })
      }
    };
    const service = new DailyFortuneService(prisma as never);

    const fortune = await service.getToday("user-1", new Date("2026-06-12T10:00:00.000Z"));

    expect(fortune.status).toBe("ready");
    expect(fortune.date).toBe("2026-06-12");
    expect(fortune.profile?.label).toBe("自己");
    expect(fortune.source?.chartId).toBe("bazi-1");
    expect(fortune.source?.usefulGods).toEqual(["water"]);
    expect(fortune.score).toBeGreaterThanOrEqual(60);
    expect(fortune.advice.length).toBeGreaterThan(0);
    expect(prisma.profile.findFirst).toHaveBeenCalledWith({
      where: { userId: "user-1", isDefault: true },
      orderBy: { createdAt: "asc" }
    });
    expect(prisma.baziChart.findFirst).toHaveBeenCalledWith({
      where: { profileId: "profile-1" },
      orderBy: { createdAt: "desc" }
    });
  });

  it("returns an onboarding state when the user has no profile", async () => {
    const service = new DailyFortuneService({
      profile: { findFirst: vi.fn().mockResolvedValue(null) },
      baziChart: { findFirst: vi.fn() }
    } as never);

    const fortune = await service.getToday("user-1", new Date("2026-06-12T10:00:00.000Z"));

    expect(fortune.status).toBe("needs_profile");
    expect(fortune.title).toBe("先建立你的命盘档案");
    expect(fortune.score).toBe(50);
  });

  it("returns a chart onboarding state when the profile has no Bazi chart", async () => {
    const service = new DailyFortuneService({
      profile: {
        findFirst: vi.fn().mockResolvedValue({
          id: "profile-1",
          label: "自己",
          isDefault: true,
          createdAt: new Date("2026-06-01T00:00:00.000Z")
        })
      },
      baziChart: { findFirst: vi.fn().mockResolvedValue(null) }
    } as never);

    const fortune = await service.getToday("user-1", new Date("2026-06-12T10:00:00.000Z"));

    expect(fortune.status).toBe("needs_bazi_chart");
    expect(fortune.profile?.id).toBe("profile-1");
    expect(fortune.title).toBe("先完成八字排盘");
  });
});
