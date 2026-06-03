import { Injectable, UnauthorizedException } from "@nestjs/common";
import { createHmac, createHash, randomBytes } from "node:crypto";
import type { UserRole } from "@metamystic/shared";

export interface TokenConfig {
  accessSecret: string;
  refreshSecret: string;
  accessTtlSeconds: number;
  refreshTtlSeconds: number;
}

export interface AccessTokenPayload {
  sub: string;
  email?: string | undefined;
  role: UserRole;
  iat?: number;
  exp?: number;
}

@Injectable()
export class TokenService {
  constructor(private readonly config: TokenConfig = getDefaultTokenConfig()) {}

  get accessTtlSeconds(): number {
    return this.config.accessTtlSeconds;
  }

  signAccessToken(payload: Omit<AccessTokenPayload, "iat" | "exp">): string {
    const iat = Math.floor(Date.now() / 1000);
    const body: AccessTokenPayload = {
      ...payload,
      iat,
      exp: iat + this.config.accessTtlSeconds
    };
    return signJwt({ ...body }, this.config.accessSecret);
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    const payload = verifyJwt(token, this.config.accessSecret);
    if (typeof payload.sub !== "string" || (payload.role !== "USER" && payload.role !== "ADMIN")) {
      throw new UnauthorizedException("Invalid access token");
    }
    return payload as unknown as AccessTokenPayload;
  }

  createRefreshToken(): { token: string; hash: string; expiresAt: Date } {
    const token = randomBytes(48).toString("base64url");
    return {
      token,
      hash: this.hashRefreshToken(token),
      expiresAt: new Date(Date.now() + this.config.refreshTtlSeconds * 1000)
    };
  }

  hashRefreshToken(token: string): string {
    return createHash("sha256").update(`${this.config.refreshSecret}:${token}`).digest("hex");
  }
}

function signJwt(payload: Record<string, unknown>, secret: string): string {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = encodeJson(header);
  const encodedPayload = encodeJson(payload);
  const signature = createHmac("sha256", secret).update(`${encodedHeader}.${encodedPayload}`).digest("base64url");
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function verifyJwt(token: string, secret: string): Record<string, unknown> {
  const [encodedHeader, encodedPayload, signature] = token.split(".");
  if (!encodedHeader || !encodedPayload || !signature) {
    throw new UnauthorizedException("Invalid token format");
  }
  const expected = createHmac("sha256", secret).update(`${encodedHeader}.${encodedPayload}`).digest("base64url");
  if (signature !== expected) {
    throw new UnauthorizedException("Invalid token signature");
  }
  const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as Record<string, unknown>;
  if (typeof payload.exp === "number" && payload.exp <= Math.floor(Date.now() / 1000)) {
    throw new UnauthorizedException("Token expired");
  }
  return payload;
}

function encodeJson(value: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function getDefaultTokenConfig(): TokenConfig {
  return {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? "local-dev-access-secret-change-before-production",
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? "local-dev-refresh-secret-change-before-production",
    accessTtlSeconds: Number(process.env.JWT_ACCESS_TTL_SECONDS ?? "900"),
    refreshTtlSeconds: Number(process.env.JWT_REFRESH_TTL_SECONDS ?? "604800")
  };
}
