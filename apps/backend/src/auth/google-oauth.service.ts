import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { GoogleUserProfile } from "./auth.service";

interface GoogleTokenResponse {
  access_token: string;
}

interface GoogleUserInfoResponse {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
  email_verified?: boolean;
}

@Injectable()
export class GoogleOAuthService {
  constructor(private readonly config: ConfigService) {}

  getAuthorizationUrl(): string {
    const clientId = this.config.get<string>("GOOGLE_CLIENT_ID");
    const redirectUri = this.config.get<string>("GOOGLE_CALLBACK_URL");
    if (!clientId || !redirectUri) {
      throw new ServiceUnavailableException("Google OAuth is not configured");
    }
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "consent"
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<GoogleUserProfile> {
    const clientId = this.config.get<string>("GOOGLE_CLIENT_ID");
    const clientSecret = this.config.get<string>("GOOGLE_CLIENT_SECRET");
    const redirectUri = this.config.get<string>("GOOGLE_CALLBACK_URL");
    if (!clientId || !clientSecret || !redirectUri) {
      throw new ServiceUnavailableException("Google OAuth is not configured");
    }

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code"
      })
    });
    if (!tokenResponse.ok) {
      throw new ServiceUnavailableException("Google OAuth token exchange failed");
    }
    const token = (await tokenResponse.json()) as GoogleTokenResponse;
    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${token.access_token}` }
    });
    if (!userInfoResponse.ok) {
      throw new ServiceUnavailableException("Google profile fetch failed");
    }
    const profile = (await userInfoResponse.json()) as GoogleUserInfoResponse;
    return {
      providerAccountId: profile.sub,
      email: profile.email,
      displayName: profile.name,
      avatarUrl: profile.picture,
      emailVerified: profile.email_verified === true
    };
  }
}
