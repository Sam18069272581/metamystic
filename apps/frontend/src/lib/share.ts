export type ShareResult = "native" | "clipboard" | "unsupported";

export interface SharePayload {
  title: string;
  text: string;
  url: string;
}

export function buildAbsoluteShareUrl(path: string, origin?: string): string {
  const baseOrigin = (origin ?? (typeof window !== "undefined" ? window.location.origin : "")).replace(/\/$/, "");
  const [pathname = "", query = ""] = path.split("?");
  const normalizedPath = pathname
    .split("/")
    .map((segment, index) => (index === 0 ? segment : encodeURIComponent(decodeURIComponent(segment))))
    .join("/");
  return `${baseOrigin}${normalizedPath}${query ? `?${query}` : ""}`;
}

export async function shareOrCopy(payload: SharePayload): Promise<ShareResult> {
  if (typeof navigator === "undefined") {
    return "unsupported";
  }
  if (typeof navigator.share === "function") {
    await navigator.share(payload);
    return "native";
  }
  if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    await navigator.clipboard.writeText(payload.url);
    return "clipboard";
  }
  return "unsupported";
}
