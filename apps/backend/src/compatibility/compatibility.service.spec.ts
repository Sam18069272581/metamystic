import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { CompatibilityService } from "./compatibility.service";

const chartA = {
  id: "bazi-a",
  profileId: "profile-a",
  dayMaster: "乙",
  dayMasterStatus: "weak",
  mainPattern: "杀印相生",
  pillars: {
    year: { stem: "乙", branch: "亥", tenGod: "比肩", hiddenStems: ["壬", "甲"], nayin: "山头火" },
    month: { stem: "辛", branch: "巳", tenGod: "七杀", hiddenStems: ["丙", "戊", "庚"], nayin: "白蜡金" },
    day: { stem: "乙", branch: "卯", tenGod: "日主", hiddenStems: ["乙"], nayin: "大溪水" },
    hour: { stem: "辛", branch: "巳", tenGod: "七杀", hiddenStems: ["丙", "戊", "庚"], nayin: "白蜡金" }
  },
  elements: { wood: 3, fire: 2, earth: 1, metal: 2, water: 1 },
  usefulGods: ["water", "wood"],
  unfavorableGods: ["metal"],
  createdAt: "2026-06-04T00:00:00.000Z"
} as const;

const chartB = {
  id: "bazi-b",
  profileId: "profile-b",
  dayMaster: "壬",
  dayMasterStatus: "strong",
  mainPattern: "食神生财",
  pillars: {
    year: { stem: "庚", branch: "申", tenGod: "偏印", hiddenStems: ["庚", "壬", "戊"], nayin: "石榴木" },
    month: { stem: "甲", branch: "子", tenGod: "食神", hiddenStems: ["癸"], nayin: "海中金" },
    day: { stem: "壬", branch: "子", tenGod: "日主", hiddenStems: ["癸"], nayin: "桑柘木" },
    hour: { stem: "丙", branch: "午", tenGod: "正财", hiddenStems: ["丁", "己"], nayin: "天河水" }
  },
  elements: { wood: 1, fire: 1, earth: 1, metal: 2, water: 4 },
  usefulGods: ["fire", "earth"],
  unfavorableGods: ["water"],
  createdAt: "2026-06-04T00:00:00.000Z"
} as const;

function savedReading() {
  return {
    id: "compat-1",
    userId: "user-1",
    profileAId: "profile-a",
    profileBId: "profile-b",
    chartAId: "bazi-a",
    chartBId: "bazi-b",
    overallScore: 76,
    level: "good",
    reading: {
      profiles: {
        a: { id: "profile-a", label: "self" },
        b: { id: "profile-b", label: "partner" }
      },
      charts: {
        a: { id: "bazi-a", profileId: "profile-a", dayMaster: "乙", dayMasterStatus: "weak", mainPattern: "杀印相生", usefulGods: ["water", "wood"] },
        b: { id: "bazi-b", profileId: "profile-b", dayMaster: "壬", dayMasterStatus: "strong", mainPattern: "食神生财", usefulGods: ["fire", "earth"] }
      },
      overallScore: 76,
      level: "good",
      dimensions: {
        fiveElement: { score: 78, summary: "五行互补明显", items: ["水木互补"] },
        stems: { score: 70, summary: "天干互动偏合", items: ["乙庚合金"] },
        branches: { score: 68, summary: "地支关系可经营", items: ["巳申六合"] },
        dayMasters: { score: 74, summary: "日主关系有扶持感", items: ["日主相生"] }
      },
      advantages: ["五行互补明显"],
      risks: ["需要同步节奏"],
      advice: ["先尊重彼此决策方式"],
      disclaimer: "合盘用于关系模式观察。"
    },
    createdAt: new Date("2026-06-05T00:00:00.000Z")
  };
}

describe("CompatibilityService", () => {
  it("creates and persists a structured compatibility reading for two owned profiles", async () => {
    const prisma = {
      profile: {
        findMany: vi.fn().mockResolvedValue([
          { id: "profile-a", userId: "user-1", label: "self", displayName: "Self" },
          { id: "profile-b", userId: "user-1", label: "partner", displayName: "Partner" }
        ])
      },
      compatibilityReading: {
        create: vi.fn().mockResolvedValue(savedReading())
      }
    };
    const baziService = {
      createChart: vi.fn().mockResolvedValueOnce(chartA).mockResolvedValueOnce(chartB)
    };
    const service = new CompatibilityService(prisma as never, baziService as never);

    const result = await service.analyzeUserProfiles("user-1", {
      profileAId: "profile-a",
      profileBId: "profile-b"
    });

    expect(baziService.createChart).toHaveBeenCalledWith("profile-a");
    expect(baziService.createChart).toHaveBeenCalledWith("profile-b");
    expect(prisma.compatibilityReading.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user-1",
        profileAId: "profile-a",
        profileBId: "profile-b",
        chartAId: "bazi-a",
        chartBId: "bazi-b",
        overallScore: expect.any(Number),
        level: expect.any(String),
        reading: expect.objectContaining({
          profiles: expect.objectContaining({
            a: { id: "profile-a", label: "self" },
            b: { id: "profile-b", label: "partner" }
          })
        })
      })
    });
    expect(result.id).toBe("compat-1");
    expect(result.overallScore).toBe(76);
    expect(result.createdAt).toBe("2026-06-05T00:00:00.000Z");
  });

  it("lists saved readings for the current user", async () => {
    const prisma = {
      compatibilityReading: {
        findMany: vi.fn().mockResolvedValue([savedReading()])
      }
    };
    const service = new CompatibilityService(prisma as never, { createChart: vi.fn() } as never);

    const result = await service.listUserReadings("user-1");

    expect(prisma.compatibilityReading.findMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      orderBy: { createdAt: "desc" },
      take: 20
    });
    expect(result.readings[0]?.id).toBe("compat-1");
    expect(result.readings[0]?.profiles.a.label).toBe("self");
  });

  it("gets one saved reading owned by the current user", async () => {
    const prisma = {
      compatibilityReading: {
        findFirst: vi.fn().mockResolvedValue(savedReading())
      }
    };
    const service = new CompatibilityService(prisma as never, { createChart: vi.fn() } as never);

    const result = await service.getUserReading("user-1", "compat-1");

    expect(prisma.compatibilityReading.findFirst).toHaveBeenCalledWith({
      where: { id: "compat-1", userId: "user-1" }
    });
    expect(result.id).toBe("compat-1");
  });

  it("gets a public share reading without requiring user ownership", async () => {
    const prisma = {
      compatibilityReading: {
        findUnique: vi.fn().mockResolvedValue(savedReading())
      }
    };
    const service = new CompatibilityService(prisma as never, { createChart: vi.fn() } as never);

    const result = await service.getPublicShareReading("compat-1");

    expect(prisma.compatibilityReading.findUnique).toHaveBeenCalledWith({ where: { id: "compat-1" } });
    expect(result.id).toBe("compat-1");
    expect(result.profiles.a.label).toBe("self");
  });

  it("rejects profiles that do not belong to the current user", async () => {
    const service = new CompatibilityService(
      {
        profile: {
          findMany: vi.fn().mockResolvedValue([
            { id: "profile-a", userId: "user-1", label: "self", displayName: "Self" },
            { id: "profile-b", userId: "user-2", label: "other", displayName: "Other" }
          ])
        }
      } as never,
      { createChart: vi.fn() } as never
    );

    await expect(
      service.analyzeUserProfiles("user-1", {
        profileAId: "profile-a",
        profileBId: "profile-b"
      })
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("requires two different existing profiles", async () => {
    const service = new CompatibilityService(
      {
        profile: {
          findMany: vi.fn().mockResolvedValue([{ id: "profile-a", userId: "user-1", label: "self", displayName: "Self" }])
        }
      } as never,
      { createChart: vi.fn() } as never
    );

    await expect(
      service.analyzeUserProfiles("user-1", {
        profileAId: "profile-a",
        profileBId: "profile-a"
      })
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
