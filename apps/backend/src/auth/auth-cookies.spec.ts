import { afterEach, describe, expect, it, vi } from "vitest";
import type { AuthSessionDto } from "@metamystic/shared";

const session: AuthSessionDto = {
  user: {
    id: "user-1",
    email: "user@example.com",
    role: "USER",
    createdAt: new Date().toISOString()
  },
  accessToken: "access-token",
  refreshToken: "refresh-token",
  expiresIn: 900
};

describe("auth cookies", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    vi.resetModules();
  });

  it("uses cross-site secure cookies in production so Vercel can call the Railway API", async () => {
    process.env.NODE_ENV = "production";
    vi.resetModules();
    const { setAuthCookies } = await import("./auth-cookies");
    const response = { setHeader: vi.fn() };

    setAuthCookies(response as never, session);

    const cookies = response.setHeader.mock.calls[0]?.[1] as string[];
    expect(cookies).toEqual(
      expect.arrayContaining([
        expect.stringContaining("SameSite=None"),
        expect.stringContaining("Secure")
      ])
    );
  });
});
