export type AuthSuccessSource = "email" | "google";

export function getAuthSuccessRedirect(source: AuthSuccessSource): string {
  return `/me?auth=${source}`;
}
