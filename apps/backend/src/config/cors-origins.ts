import { normalizePublicOrigin } from "./public-app-url";

export type CorsOrigin = string | RegExp;

export function buildCorsOrigins(env: Partial<Record<"FRONTEND_APP_URL" | "CORS_ORIGINS", string | undefined>>): CorsOrigin[] {
  const configuredOrigins = [
    env.FRONTEND_APP_URL,
    ...(env.CORS_ORIGINS?.split(",") ?? [])
  ]
    .map((origin) => normalizePublicOrigin(origin))
    .filter((origin): origin is string => Boolean(origin));

  return [
    /^http:\/\/localhost:\d+$/,
    /^http:\/\/127\.0\.0\.1:\d+$/,
    ...Array.from(new Set(configuredOrigins))
  ];
}
