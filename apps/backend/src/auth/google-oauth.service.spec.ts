import { describe, expect, it } from "vitest";
import { GoogleOAuthService } from "./google-oauth.service";

describe("GoogleOAuthService", () => {
  it("includes the caller state in the authorization URL", () => {
    const config = {
      get: (key: string) => ({
        GOOGLE_CLIENT_ID: "client-id",
        GOOGLE_CALLBACK_URL: "https://api.example.com/api/v1/auth/google/callback"
      })[key]
    };

    const url = new URL(new GoogleOAuthService(config as never).getAuthorizationUrl("state-123"));

    expect(url.searchParams.get("state")).toBe("state-123");
  });
});
