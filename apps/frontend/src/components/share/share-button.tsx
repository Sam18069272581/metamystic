"use client";

import { useMemo, useState } from "react";
import { Share2 } from "lucide-react";
import { buildAbsoluteShareUrl, shareOrCopy, type SharePayload } from "@/lib/share";

export function ShareButton({
  className,
  path,
  text,
  title
}: {
  className?: string;
  path: string;
  text: string;
  title: string;
}) {
  const [status, setStatus] = useState<"idle" | "copied" | "shared" | "unsupported">("idle");
  const url = useMemo(() => buildAbsoluteShareUrl(path), [path]);

  async function handleShare(): Promise<void> {
    const payload: SharePayload = { title, text, url };
    const result = await shareOrCopy(payload);
    setStatus(result === "native" ? "shared" : result === "clipboard" ? "copied" : "unsupported");
  }

  return (
    <button
      className={
        className ??
        "inline-flex items-center justify-center gap-2 rounded-full border border-amber-200/20 bg-amber-200/10 px-3 py-1.5 text-xs font-semibold text-amber-100 transition hover:bg-amber-200/15"
      }
      onClick={() => void handleShare()}
      type="button"
    >
      <Share2 className="h-3.5 w-3.5" />
      {statusText(status)}
    </button>
  );
}

function statusText(status: "idle" | "copied" | "shared" | "unsupported"): string {
  if (status === "copied") {
    return "已复制";
  }
  if (status === "shared") {
    return "已分享";
  }
  if (status === "unsupported") {
    return "无法分享";
  }
  return "分享";
}
