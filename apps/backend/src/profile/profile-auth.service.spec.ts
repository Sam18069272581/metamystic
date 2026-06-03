import { describe, expect, it, vi } from "vitest";
import { ProfileService } from "./profile.service";

describe("ProfileService authenticated profile", () => {
  it("upserts the current user's profile without requiring an anonymous user id", async () => {
    const prisma = {
      user: {
        upsert: vi.fn()
      },
      profile: {
        upsert: vi.fn().mockResolvedValue({
          id: "profile-1",
          userId: "user-1",
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
    expect(prisma.profile.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1" },
        create: expect.objectContaining({ userId: "user-1" })
      })
    );
    expect(profile.anonymousUserId).toBe("");
  });
});
