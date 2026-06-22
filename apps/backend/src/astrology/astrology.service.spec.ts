import { ForbiddenException, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { AstrologyService } from "./astrology.service";

describe("AstrologyService", () => {
  it("does not publish the seeded astrology approximation as a formal chart", async () => {
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

    await expect(service.createChart("profile-1")).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(prisma.astrologyChart.create).not.toHaveBeenCalled();
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

    await expect(service.createUserChart("user-1", "profile-1")).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(prisma.astrologyChart.create).not.toHaveBeenCalled();
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
