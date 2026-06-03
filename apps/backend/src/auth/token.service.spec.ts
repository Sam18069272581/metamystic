import { describe, expect, it } from "vitest";
import { TokenService } from "./token.service";

describe("TokenService", () => {
  it("signs and verifies access JWT payloads", () => {
    const service = new TokenService({
      accessSecret: "test-access-secret-at-least-32-bytes",
      refreshSecret: "test-refresh-secret-at-least-32-bytes",
      accessTtlSeconds: 900,
      refreshTtlSeconds: 604800
    });

    const token = service.signAccessToken({ sub: "user-1", email: "user@example.com", role: "USER" });
    const payload = service.verifyAccessToken(token);

    expect(payload.sub).toBe("user-1");
    expect(payload.role).toBe("USER");
    expect(payload.exp ?? 0).toBeGreaterThan(payload.iat ?? 0);
  });

  it("creates opaque refresh tokens and stores only hashes", () => {
    const service = new TokenService({
      accessSecret: "test-access-secret-at-least-32-bytes",
      refreshSecret: "test-refresh-secret-at-least-32-bytes",
      accessTtlSeconds: 900,
      refreshTtlSeconds: 604800
    });

    const refresh = service.createRefreshToken();

    expect(refresh.token).not.toBe(refresh.hash);
    expect(refresh.hash).toHaveLength(64);
    expect(refresh.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });
});
