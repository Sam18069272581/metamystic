type PublicEnv =
  | NodeJS.ProcessEnv
  | Partial<Record<"NEXT_PUBLIC_API_BASE_URL" | "NEXT_PUBLIC_APP_URL" | "NODE_ENV", string | undefined>>;

const DEFAULT_LOCAL_API_BASE_URL = "http://localhost:4000/api/v1";
const DEFAULT_PRODUCTION_API_BASE_URL = "/api/v1";
const DEFAULT_SITE_URL = "https://metamystic.vercel.app";

function trimTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, "");
}

export function getApiBaseUrl(env: PublicEnv): string {
  if (env.NEXT_PUBLIC_API_BASE_URL) {
    return trimTrailingSlashes(env.NEXT_PUBLIC_API_BASE_URL);
  }
  return env.NODE_ENV === "production" ? DEFAULT_PRODUCTION_API_BASE_URL : DEFAULT_LOCAL_API_BASE_URL;
}

export function getSiteUrl(env: PublicEnv): string {
  const rawUrl = env.NEXT_PUBLIC_APP_URL ?? DEFAULT_SITE_URL;
  try {
    return new URL(rawUrl).origin;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export function buildGoogleAuthUrl(apiBaseUrl: string): string {
  return `${trimTrailingSlashes(apiBaseUrl)}/auth/google`;
}
