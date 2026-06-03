import { describe, expect, it, vi } from "vitest";
import { ZiweiService } from "./ziwei.service";

describe("ZiweiService", () => {
  it("stores a deterministic twelve-palace chart from a profile", async () => {
    const prisma = {
      profile: {
        findUnique: vi.fn().mockResolvedValue({
          id: "profile-1",
          birthTime: new Date("1995-05-20T10:30:00.000Z"),
          gender: "female"
        })
      },
      ziweiChart: {
        create: vi.fn().mockImplementation(({ data }) => ({
          id: "ziwei-db-1",
          profileId: data.profileId,
          lifePalace: data.lifePalace,
          bodyPalace: data.bodyPalace,
          palaces: data.palaces,
          summary: data.summary,
          metadata: data.metadata,
          createdAt: new Date("2026-05-31T00:00:00.000Z")
        }))
      }
    };
    const service = new ZiweiService(prisma as never);

    const chart = await service.createChart("profile-1");

    expect(chart.id).toBe("ziwei-db-1");
    expect(chart.palaces).toHaveLength(12);
    expect(chart.palaces.map((palace) => palace.label)).toContain("\u547d\u5bab");
    expect(chart.lifePalace).toBeTruthy();
    expect(chart.bodyPalace).toBeTruthy();
    expect(chart.analysis?.lifeTheme).toContain("\u547d\u5bab");
    expect(chart.analysis?.career).toContain("\u5b98\u7984");
    expect(prisma.ziweiChart.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        profileId: "profile-1",
        palaces: expect.any(Array)
      })
    });
  });

  it("stores a chart for the current user's own profile", async () => {
    const prisma = {
      profile: {
        findUnique: vi.fn().mockResolvedValue({
          id: "profile-1",
          userId: "user-1",
          birthTime: new Date("1995-05-20T10:30:00.000Z")
        })
      },
      ziweiChart: {
        create: vi.fn().mockImplementation(({ data }) => ({
          id: "ziwei-user-db-1",
          profileId: data.profileId,
          lifePalace: data.lifePalace,
          bodyPalace: data.bodyPalace,
          palaces: data.palaces,
          summary: data.summary,
          metadata: data.metadata,
          createdAt: new Date("2026-05-31T00:00:00.000Z")
        }))
      }
    };
    const service = new ZiweiService(prisma as never);

    const chart = await service.createUserChart("user-1", "profile-1");

    expect(chart.id).toBe("ziwei-user-db-1");
    expect(chart.analysis?.advice).toContain("\u4e09\u65b9\u56db\u6b63");
    expect(prisma.ziweiChart.create).toHaveBeenCalledOnce();
  });
});
