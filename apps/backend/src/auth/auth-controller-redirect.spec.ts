import { describe, expect, it, vi } from "vitest";
import { AuthController } from "./auth.controller";

describe("AuthController Google callback", () => {
  it("sets auth cookies and redirects to the frontend instead of returning tokens as JSON", async () => {
    const authService = {
      loginWithGoogle: vi.fn().mockResolvedValue({
        user: { id: "user-1", email: "user@example.com", role: "USER" },
        accessToken: "access-token",
        refreshToken: "refresh-token",
        expiresIn: 900
      })
    };
    const googleOAuth = {
      exchangeCode: vi.fn().mockResolvedValue({
        providerAccountId: "google-sub",
        email: "user@example.com",
        emailVerified: true
      }),
      getAuthorizationUrl: vi.fn()
    };
    const response = {
      setHeader: vi.fn(),
      redirect: vi.fn()
    };
    const previousUrl = process.env.FRONTEND_APP_URL;
    process.env.FRONTEND_APP_URL = "http://localhost:3000";
    const controller = new AuthController(authService as never, googleOAuth as never);

    await controller.googleCallback("oauth-code", response as never);

    expect(response.setHeader).toHaveBeenCalledWith("Set-Cookie", expect.any(Array));
    expect(response.redirect).toHaveBeenCalledWith("http://localhost:3000/me");
    process.env.FRONTEND_APP_URL = previousUrl;
  });

  it("normalizes the frontend app URL before redirecting back to /me", async () => {
    const authService = {
      loginWithGoogle: vi.fn().mockResolvedValue({
        user: { id: "user-1", email: "user@example.com", role: "USER" },
        accessToken: "access-token",
        refreshToken: "refresh-token",
        expiresIn: 900
      })
    };
    const googleOAuth = {
      exchangeCode: vi.fn().mockResolvedValue({
        providerAccountId: "google-sub",
        email: "user@example.com",
        emailVerified: true
      }),
      getAuthorizationUrl: vi.fn()
    };
    const response = {
      setHeader: vi.fn(),
      redirect: vi.fn()
    };
    const previousUrl = process.env.FRONTEND_APP_URL;
    process.env.FRONTEND_APP_URL = "https://metamystic.app/app/";
    const controller = new AuthController(authService as never, googleOAuth as never);

    await controller.googleCallback("oauth-code", response as never);

    expect(response.redirect).toHaveBeenCalledWith("https://metamystic.app/me");
    process.env.FRONTEND_APP_URL = previousUrl;
  });
});
