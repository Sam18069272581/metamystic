import { describe, expect, it } from "vitest";
import { buildCorsOrigins } from "./cors-origins";

describe("buildCorsOrigins", () => {
  it("allows localhost during local development", () => {
    const origins = buildCorsOrigins({});

    expect(origins.some((origin) => origin instanceof RegExp && origin.test("http://localhost:3000"))).toBe(true);
  });

  it("includes production frontend origins from env", () => {
    const origins = buildCorsOrigins({
      FRONTEND_APP_URL: "https://metamystic.app",
      CORS_ORIGINS: "https://preview.metamystic.app, https://admin.metamystic.app/"
    });

    expect(origins).toContain("https://metamystic.app");
    expect(origins).toContain("https://preview.metamystic.app");
    expect(origins).toContain("https://admin.metamystic.app");
  });
});
