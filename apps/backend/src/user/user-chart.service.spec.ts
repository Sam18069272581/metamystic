import { describe, expect, it, vi } from "vitest";
import { NotFoundException } from "@nestjs/common";
import { UserChartService } from "./user-chart.service";

describe("UserChartService", () => {
  it("lists the current user's profile and chart archive", async () => {
    const prisma = {
      profile: {
        findFirst: vi.fn().mockResolvedValue({
          id: "profile-1",
          userId: "user-1",
          label: "self",
          isDefault: true,
          displayName: "命主",
          birthTime: new Date("1995-05-20T10:30:00.000Z"),
          birthTimezone: "Asia/Shanghai",
          gender: "female",
          birthPlace: "北京",
          latitude: 39.9042,
          longitude: 116.4074,
          createdAt: new Date("2026-05-31T00:00:00.000Z"),
          updatedAt: new Date("2026-05-31T00:00:00.000Z")
        })
      },
      baziChart: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "bazi-1",
            profileId: "profile-1",
            dayMaster: "乙",
            dayMasterStatus: "balanced",
            mainPattern: "财官相生",
            pillars: {
              year: { stem: "乙", branch: "亥", tenGod: "比肩", hiddenStems: ["壬"], nayin: "山头火" },
              month: { stem: "辛", branch: "巳", tenGod: "七杀", hiddenStems: ["丙"], nayin: "白蜡金" },
              day: { stem: "乙", branch: "卯", tenGod: "日主", hiddenStems: ["乙"], nayin: "大溪水" },
              hour: { stem: "辛", branch: "巳", tenGod: "七杀", hiddenStems: ["丙"], nayin: "白蜡金" }
            },
            elements: { wood: 2, fire: 1, earth: 0, metal: 1, water: 1 },
            metadata: { usefulGods: ["water"], unfavorableGods: ["metal"] },
            createdAt: new Date("2026-05-31T00:01:00.000Z")
          }
        ])
      },
      ziweiChart: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "ziwei-1",
            profileId: "profile-1",
            lifePalace: "life",
            bodyPalace: "career",
            palaces: [],
            summary: "紫微盘",
            createdAt: new Date("2026-05-31T00:02:00.000Z")
          }
        ])
      },
      astrologyChart: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "astrology-1",
            profileId: "profile-1",
            placements: [],
            houses: [],
            dominantElements: { wood: 0, fire: 1, earth: 1, metal: 1, water: 0 },
            summary: "星盘",
            createdAt: new Date("2026-05-31T00:03:00.000Z")
          }
        ])
      }
    };
    const service = new UserChartService(prisma as never);

    const archive = await service.listMyCharts("user-1");

    expect(archive.profile?.id).toBe("profile-1");
    expect(archive.profile?.isDefault).toBe(true);
    expect(archive.baziCharts[0]?.id).toBe("bazi-1");
    expect(archive.baziCharts[0]?.usefulGods).toEqual(["water"]);
    expect(archive.ziweiCharts[0]?.id).toBe("ziwei-1");
    expect(archive.astrologyCharts[0]?.id).toBe("astrology-1");
    expect(prisma.profile.findFirst).toHaveBeenCalledWith({
      where: { userId: "user-1", isDefault: true },
      orderBy: { createdAt: "asc" }
    });
    expect(prisma.baziChart.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { profileId: "profile-1" } }));
  });

  it("returns an empty archive when the user has no profile", async () => {
    const service = new UserChartService({
      profile: { findFirst: vi.fn().mockResolvedValue(null) }
    } as never);

    await expect(service.listMyCharts("user-without-profile")).resolves.toEqual({
      profile: undefined,
      baziCharts: [],
      ziweiCharts: [],
      astrologyCharts: []
    });
  });

  it("returns one owned chart detail by kind and id", async () => {
    const prisma = {
      baziChart: {
        findFirst: vi.fn().mockResolvedValue({
          id: "bazi-1",
          profileId: "profile-1",
          dayMaster: "乙",
          dayMasterStatus: "balanced",
          mainPattern: "财官相生",
          pillars: {
            year: { stem: "乙", branch: "亥", tenGod: "比肩", hiddenStems: ["壬"], nayin: "山头火" },
            month: { stem: "辛", branch: "巳", tenGod: "七杀", hiddenStems: ["丙"], nayin: "白蜡金" },
            day: { stem: "乙", branch: "卯", tenGod: "日主", hiddenStems: ["乙"], nayin: "大溪水" },
            hour: { stem: "辛", branch: "巳", tenGod: "七杀", hiddenStems: ["丙"], nayin: "白蜡金" }
          },
          elements: { wood: 2, fire: 1, earth: 0, metal: 1, water: 1 },
          metadata: {},
          createdAt: new Date("2026-05-31T00:01:00.000Z")
        })
      }
    };
    const service = new UserChartService(prisma as never);

    const detail = await service.getMyChart("user-1", "bazi", "bazi-1");

    expect(detail.kind).toBe("bazi");
    expect(detail.chart.id).toBe("bazi-1");
    expect(prisma.baziChart.findFirst).toHaveBeenCalledWith({
      where: {
        id: "bazi-1",
        profile: { userId: "user-1" }
      }
    });
  });

  it("throws when a chart detail is missing or not owned", async () => {
    const service = new UserChartService({
      ziweiChart: { findFirst: vi.fn().mockResolvedValue(null) }
    } as never);

    await expect(service.getMyChart("user-1", "ziwei", "missing")).rejects.toBeInstanceOf(NotFoundException);
  });
});
