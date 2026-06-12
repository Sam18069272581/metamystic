const DEFAULT_FRONTEND_APP_URL = "http://localhost:3000";

export function normalizePublicOrigin(rawUrl: string | undefined): string | undefined {
  if (!rawUrl?.trim()) {
    return undefined;
  }
  try {
    const parsed = new URL(rawUrl.trim());
    return parsed.origin;
  } catch {
    return undefined;
  }
}

export function getFrontendAppUrl(env: Partial<Record<"FRONTEND_APP_URL", string | undefined>>): string {
  return normalizePublicOrigin(env.FRONTEND_APP_URL) ?? DEFAULT_FRONTEND_APP_URL;
}
