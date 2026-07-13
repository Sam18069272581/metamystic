export type ShareResult = "native" | "clipboard" | "unsupported";
export type ShareStatus = "idle" | "copied" | "shared" | "unsupported";

export type ShareStatusLabels = Record<ShareStatus, string>;

export interface SharePayload {
  title: string;
  text: string;
  url: string;
}

const defaultShareStatusLabels: ShareStatusLabels = {
  idle: "分享",
  copied: "已复制",
  shared: "已分享",
  unsupported: "无法分享"
};

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

export function statusText(status: ShareStatus, labels: ShareStatusLabels = defaultShareStatusLabels): string {
  return labels[status];
}
