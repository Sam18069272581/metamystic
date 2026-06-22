import { ConflictException, UnauthorizedException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { AuthService } from "./auth.service";

function createPrismaMock() {
  return {
    authIdentity: {
      findUnique: vi.fn(),
      create: vi.fn()
    },
    user: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn()
    },
    refreshToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn()
    },
    $transaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) => callback(createPrismaMock()))
  };
}

describe("AuthService", () => {
  it("registers an email user and returns an auth session", async () => {
    const prisma = createPrismaMock();
    prisma.authIdentity.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({ id: "user-1", email: "user@example.com", role: "USER" });
    prisma.authIdentity.create.mockResolvedValue({});
    prisma.refreshToken.create.mockResolvedValue({});
    const service = new AuthService(prisma as never);

    const session = await service.register({
      email: " User@Example.com ",
      password: "Correct Horse Battery Staple 42!",
      displayName: "\u5c0f\u7384"
    });

    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ email: "user@example.com", displayName: "\u5c0f\u7384" })
      })
    );
    expect(session.user.email).toBe("user@example.com");
    expect(session.accessToken).toContain(".");
    expect(session.refreshToken).toBeTruthy();
  });

  it("rejects duplicate email registrations", async () => {
    const prisma = createPrismaMock();
    prisma.authIdentity.findUnique.mockResolvedValue({ id: "identity-1" });
    const service = new AuthService(prisma as never);

    await expect(
      service.register({
        email: "user@example.com",
        password: "Correct Horse Battery Staple 42!"
      })
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("rejects invalid login credentials", async () => {
    const prisma = createPrismaMock();
    prisma.authIdentity.findUnique.mockResolvedValue(null);
    const service = new AuthService(prisma as never);

    await expect(service.login({ email: "missing@example.com", password: "wrong" })).rejects.toBeInstanceOf(
      UnauthorizedException
    );
  });

  it("creates a session for a new Google identity", async () => {
    const prisma = createPrismaMock();
    prisma.authIdentity.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: "user-google",
      email: "google@example.com",
      displayName: "\u8c37\u6b4c\u7528\u6237",
      avatarUrl: "https://example.com/avatar.png",
      role: "USER"
    });
    prisma.refreshToken.create.mockResolvedValue({});
    const service = new AuthService(prisma as never);

    const session = await service.loginWithGoogle({
      providerAccountId: "google-sub-1",
      email: "google@example.com",
      displayName: "\u8c37\u6b4c\u7528\u6237",
      avatarUrl: "https://example.com/avatar.png",
      emailVerified: true
    });

    expect(session.user.email).toBe("google@example.com");
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: "google@example.com",
          identities: {
            create: expect.objectContaining({
              provider: "GOOGLE",
              providerAccountId: "google-sub-1"
            })
          }
        })
      })
    );
  });

  it("links a verified Google identity to an existing email user", async () => {
    const prisma = createPrismaMock();
    prisma.authIdentity.findUnique.mockResolvedValue(null);
    prisma.user.findUnique.mockResolvedValue({
      id: "user-email",
      email: "user@example.com",
      role: "USER"
    });
    prisma.authIdentity.create.mockResolvedValue({});
    prisma.refreshToken.create.mockResolvedValue({});
    const service = new AuthService(prisma as never);

    const session = await service.loginWithGoogle({
      providerAccountId: "google-sub-1",
      email: "user@example.com",
      emailVerified: true
    });

    expect(session.user.id).toBe("user-email");
    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(prisma.authIdentity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: "user-email", provider: "GOOGLE" })
    });
  });

  it("revokes the presented refresh token during logout", async () => {
    const prisma = createPrismaMock();
    prisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });
    const service = new AuthService(prisma as never);

    await service.revokeRefreshToken("refresh-token");

    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: expect.objectContaining({ tokenHash: expect.any(String), revokedAt: null }),
      data: { revokedAt: expect.any(Date) }
    });
  });
});
