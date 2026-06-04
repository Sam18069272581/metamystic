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

describe("CompatibilityService", () => {
  it("creates a structured compatibility reading for two owned profiles", async () => {
    const prisma = {
      profile: {
        findMany: vi.fn().mockResolvedValue([
          { id: "profile-a", userId: "user-1", label: "self", displayName: "Self" },
          { id: "profile-b", userId: "user-1", label: "partner", displayName: "Partner" }
        ])
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

    expect(prisma.profile.findMany).toHaveBeenCalledWith({
      where: { id: { in: ["profile-a", "profile-b"] } },
      select: { id: true, userId: true, label: true, displayName: true }
    });
    expect(baziService.createChart).toHaveBeenCalledWith("profile-a");
    expect(baziService.createChart).toHaveBeenCalledWith("profile-b");
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.profiles.a.label).toBe("self");
    expect(result.profiles.b.label).toBe("partner");
    expect(result.dimensions.fiveElement.score).toBeGreaterThan(0);
    expect(result.dimensions.branches.items.length).toBeGreaterThan(0);
    expect(result.advantages.length).toBeGreaterThan(0);
    expect(result.risks.length).toBeGreaterThan(0);
    expect(result.advice.length).toBeGreaterThan(0);
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
