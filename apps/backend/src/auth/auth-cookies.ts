import type { Response } from "express";
import type { AuthSessionDto } from "@metamystic/shared";

const isProduction = process.env.NODE_ENV === "production";

export function setAuthCookies(response: Response, session: AuthSessionDto): void {
  response.setHeader("Set-Cookie", [
    serializeCookie("access_token", session.accessToken, session.expiresIn),
    serializeCookie("refresh_token", session.refreshToken, 60 * 60 * 24 * 7)
  ]);
}

export function clearAuthCookies(response: Response): void {
  response.setHeader("Set-Cookie", [
    serializeCookie("access_token", "", 0),
    serializeCookie("refresh_token", "", 0)
  ]);
}

export function readCookie(cookieHeader: string | undefined, name: string): string | undefined {
  return cookieHeader
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

function serializeCookie(name: string, value: string, maxAge: number): string {
  const secure = isProduction ? "; Secure" : "";
  return `${name}=${encodeURIComponent(value)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secure}`;
}
