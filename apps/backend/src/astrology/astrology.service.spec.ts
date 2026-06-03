import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { AstrologyService } from "./astrology.service";

describe("AstrologyService", () => {
  it("stores a deterministic astrology chart with core placements and twelve houses", async () => {
    const prisma = {
      profile: {
        findUnique: async () => ({
          id: "profile-1",
          userId: "user-1",
          birthTime: new Date("1995-05-20T10:30:00.000Z"),
          latitude: 39.9042,
          longitude: 116.4074
        })
      },
      astrologyChart: {
        create: vi.fn().mockImplementation(({ data }) => ({
          id: "astrology-db-1",
          profileId: data.profileId,
          placements: data.placements,
          houses: data.houses,
          dominantElements: data.dominantElements,
          summary: data.summary,
          metadata: data.metadata,
          createdAt: new Date("2026-05-31T00:00:00.000Z")
        }))
      }
    };
    const service = new AstrologyService(prisma as never);

    const chart = await service.createChart("profile-1");

    expect(chart.id).toBe("astrology-db-1");
    expect(chart.placements).toHaveLength(3);
    expect(chart.placements.map((placement) => placement.body)).toEqual(["Sun", "Moon", "Ascendant"]);
    expect(chart.houses).toHaveLength(12);
    expect(chart.houses[0]?.house).toBe(1);
    expect(chart.summary).toContain("\u661f\u76d8");
    expect(chart.analysis?.coreIdentity).toContain("\u592a\u9633");
    expect(chart.analysis?.socialMask).toContain("\u4e0a\u5347");
    expect(prisma.astrologyChart.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        profileId: "profile-1",
        placements: expect.any(Array),
        houses: expect.any(Array)
      })
    });
  });

  it("rejects profiles owned by another user", async () => {
    const prisma = {
      profile: {
        findUnique: async () => ({
          id: "profile-1",
          userId: "other-user",
          birthTime: new Date("1995-05-20T10:30:00.000Z"),
          latitude: null,
          longitude: null
        })
      }
    };
    const service = new AstrologyService(prisma as never);

    await expect(service.createUserChart("user-1", "profile-1")).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("stores a chart for the current user's own profile", async () => {
    const prisma = {
      profile: {
        findUnique: async () => ({
          id: "profile-1",
          userId: "user-1",
          birthTime: new Date("1995-05-20T10:30:00.000Z"),
          latitude: 39.9042,
          longitude: 116.4074
        })
      },
      astrologyChart: {
        create: vi.fn().mockImplementation(({ data }) => ({
          id: "astrology-user-db-1",
          profileId: data.profileId,
          placements: data.placements,
          houses: data.houses,
          dominantElements: data.dominantElements,
          summary: data.summary,
          metadata: data.metadata,
          createdAt: new Date("2026-05-31T00:00:00.000Z")
        }))
      }
    };
    const service = new AstrologyService(prisma as never);

    const chart = await service.createUserChart("user-1", "profile-1");

    expect(chart.id).toBe("astrology-user-db-1");
    expect(chart.analysis?.advice).toContain("\u5143\u7d20");
    expect(prisma.astrologyChart.create).toHaveBeenCalledOnce();
  });

  it("throws when profile is missing", async () => {
    const prisma = {
      profile: {
        findUnique: async () => null
      }
    };
    const service = new AstrologyService(prisma as never);

    await expect(service.createChart("missing-profile")).rejects.toBeInstanceOf(NotFoundException);
  });
});
