import { describe, expect, it } from "vitest";
import { buildGoogleAuthUrl, getApiBaseUrl, getSiteUrl } from "./public-url";

describe("public URL helpers", () => {
  it("uses the configured API base URL for Google auth", () => {
    expect(buildGoogleAuthUrl("https://api.metamystic.app/api/v1")).toBe("https://api.metamystic.app/api/v1/auth/google");
  });

  it("falls back to local backend and app URLs", () => {
    expect(getApiBaseUrl({})).toBe("http://localhost:4000/api/v1");
    expect(getSiteUrl({})).toBe("https://metamystic.vercel.app");
  });

  it("uses the same-origin API proxy by default in production", () => {
    expect(getApiBaseUrl({ NODE_ENV: "production" })).toBe("/api/v1");
  });

  it("normalizes trailing slashes from configured URLs", () => {
    expect(
      getApiBaseUrl({
        NEXT_PUBLIC_API_BASE_URL: "https://api.metamystic.app/api/v1///"
      })
    ).toBe("https://api.metamystic.app/api/v1");

    expect(
      getSiteUrl({
        NEXT_PUBLIC_APP_URL: "https://metamystic.app///"
      })
    ).toBe("https://metamystic.app");
  });

  it("normalizes the public app URL down to its origin", () => {
    expect(
      getSiteUrl({
        NEXT_PUBLIC_APP_URL: "https://metamystic.app/share/compatibility/"
      })
    ).toBe("https://metamystic.app");
  });
});
