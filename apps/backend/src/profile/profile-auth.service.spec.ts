import { describe, expect, it, vi } from "vitest";
import { ProfileService } from "./profile.service";

describe("ProfileService authenticated profile", () => {
  it("updates the current user's default profile without requiring an anonymous user id", async () => {
    const prisma = {
      user: {
        upsert: vi.fn()
      },
      profile: {
        findFirst: vi.fn().mockResolvedValue({
          id: "profile-1"
        }),
        update: vi.fn().mockResolvedValue({
          id: "profile-1",
          userId: "user-1",
          label: "self",
          isDefault: true,
          displayName: "\u5c0f\u7384",
          birthTime: new Date("1995-05-20T10:30:00.000Z"),
          birthTimezone: "Europe/Berlin",
          gender: "female",
          birthPlace: "\u5317\u4eac",
          latitude: 39.9042,
          longitude: 116.4074,
          createdAt: new Date("2026-05-30T00:00:00.000Z"),
          updatedAt: new Date("2026-05-30T00:00:00.000Z")
        })
      }
    };
    const service = new ProfileService(prisma as never);

    const profile = await service.upsertUserProfile("user-1", {
      displayName: "\u5c0f\u7384",
      birthTime: "1995-05-20T10:30:00.000Z",
      birthTimezone: "Europe/Berlin",
      gender: "female",
      birthPlace: "\u5317\u4eac",
      latitude: 39.9042,
      longitude: 116.4074
    });

    expect(prisma.user.upsert).not.toHaveBeenCalled();
    expect(prisma.profile.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1", isDefault: true }
      })
    );
    expect(prisma.profile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "profile-1" },
        data: expect.objectContaining({ displayName: "\u5c0f\u7384" })
      })
    );
    expect(profile.anonymousUserId).toBe("");
    expect(profile.isDefault).toBe(true);
  });

  it("creates the first user profile as default", async () => {
    const prisma = {
      profile: {
        count: vi.fn().mockResolvedValue(0),
        create: vi.fn().mockResolvedValue({
          id: "profile-1",
          userId: "user-1",
          label: "self",
          isDefault: true,
          displayName: "Ming",
          birthTime: new Date("1995-05-20T10:30:00.000Z"),
          birthTimezone: "Europe/Berlin",
          gender: "female",
          birthPlace: "Beijing",
          latitude: 39.9042,
          longitude: 116.4074,
          createdAt: new Date("2026-05-30T00:00:00.000Z"),
          updatedAt: new Date("2026-05-30T00:00:00.000Z")
        })
      }
    };
    const service = new ProfileService(prisma as never);

    const profile = await service.createUserProfile("user-1", {
      label: "self",
      displayName: "Ming",
      birthTime: "1995-05-20T10:30:00.000Z",
      birthTimezone: "Europe/Berlin",
      gender: "female",
      birthPlace: "Beijing",
      latitude: 39.9042,
      longitude: 116.4074
    });

    expect(prisma.profile.count).toHaveBeenCalledWith({ where: { userId: "user-1" } });
    expect(prisma.profile.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: "user-1", label: "self", isDefault: true })
      })
    );
    expect(profile.label).toBe("self");
    expect(profile.isDefault).toBe(true);
  });

  it("forces the first user profile to default even when the request opts out", async () => {
    const prisma = {
      profile: {
        count: vi.fn().mockResolvedValue(0),
        create: vi.fn().mockResolvedValue({
          id: "profile-1",
          userId: "user-1",
          label: "first",
          isDefault: true,
          displayName: "First",
          birthTime: new Date("1995-05-20T10:30:00.000Z"),
          birthTimezone: "Europe/Berlin",
          gender: "female",
          birthPlace: null,
          latitude: null,
          longitude: null,
          createdAt: new Date("2026-05-30T00:00:00.000Z"),
          updatedAt: new Date("2026-05-30T00:00:00.000Z")
        })
      }
    };
    const service = new ProfileService(prisma as never);

    await service.createUserProfile("user-1", {
      label: "first",
      displayName: "First",
      birthTime: "1995-05-20T10:30:00.000Z",
      birthTimezone: "Europe/Berlin",
      gender: "female",
      isDefault: false
    });

    expect(prisma.profile.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ isDefault: true })
      })
    );
  });

  it("sets only one profile as default for the current user", async () => {
    const prisma = {
      profile: {
        findFirst: vi.fn().mockResolvedValue({ id: "profile-2", userId: "user-1" }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        update: vi.fn().mockResolvedValue({
          id: "profile-2",
          userId: "user-1",
          label: "partner",
          isDefault: true,
          displayName: "Partner",
          birthTime: new Date("1992-08-01T02:00:00.000Z"),
          birthTimezone: "Asia/Shanghai",
          gender: "male",
          birthPlace: "Shanghai",
          latitude: 31.2304,
          longitude: 121.4737,
          createdAt: new Date("2026-05-30T00:00:00.000Z"),
          updatedAt: new Date("2026-05-30T00:00:00.000Z")
        })
      },
      $transaction: vi.fn(async (operations: Array<Promise<unknown>>) => Promise.all(operations))
    };
    const service = new ProfileService(prisma as never);

    const profile = await service.setDefaultUserProfile("user-1", "profile-2");

    expect(prisma.profile.findFirst).toHaveBeenCalledWith({ where: { id: "profile-2", userId: "user-1" } });
    expect(prisma.profile.updateMany).toHaveBeenCalledWith({ where: { userId: "user-1" }, data: { isDefault: false } });
    expect(prisma.profile.update).toHaveBeenCalledWith({ where: { id: "profile-2" }, data: { isDefault: true } });
    expect(profile.id).toBe("profile-2");
    expect(profile.isDefault).toBe(true);
  });

  it("lists profiles with the default profile id", async () => {
    const prisma = {
      profile: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "profile-1",
            userId: "user-1",
            label: "self",
            isDefault: true,
            displayName: "Self",
            birthTime: new Date("1995-05-20T10:30:00.000Z"),
            birthTimezone: "Europe/Berlin",
            gender: "female",
            birthPlace: "Beijing",
            latitude: 39.9042,
            longitude: 116.4074,
            createdAt: new Date("2026-05-30T00:00:00.000Z"),
            updatedAt: new Date("2026-05-30T00:00:00.000Z")
          },
          {
            id: "profile-2",
            userId: "user-1",
            label: "partner",
            isDefault: false,
            displayName: "Partner",
            birthTime: new Date("1992-08-01T02:00:00.000Z"),
            birthTimezone: "Asia/Shanghai",
            gender: "male",
            birthPlace: "Shanghai",
            latitude: 31.2304,
            longitude: 121.4737,
            createdAt: new Date("2026-05-31T00:00:00.000Z"),
            updatedAt: new Date("2026-05-31T00:00:00.000Z")
          }
        ])
      }
    };
    const service = new ProfileService(prisma as never);

    const result = await service.listUserProfiles("user-1");

    expect(prisma.profile.findMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }]
    });
    expect(result.defaultProfileId).toBe("profile-1");
    expect(result.profiles).toHaveLength(2);
  });
});
