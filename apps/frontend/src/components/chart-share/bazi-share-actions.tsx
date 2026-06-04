"use client";

import Link from "next/link";
import { Copy, ExternalLink, Share2 } from "lucide-react";
import { useMemo, useState } from "react";
import { buildBaziSharePath, buildBaziShareUrl } from "./chart-share";

export function BaziShareActions({ chartId }: { chartId: string }) {
  const [copied, setCopied] = useState(false);
  const sharePath = buildBaziSharePath(chartId);
  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return sharePath;
    }
    return buildBaziShareUrl(window.location.origin, chartId);
  }, [chartId, sharePath]);

  async function copyShareLink(): Promise<void> {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    }
  }

  return (
    <div className="mt-3 rounded-2xl border border-amber-200/12 bg-amber-200/[0.045] p-3">
      <div className="flex items-start gap-2">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-amber-200/20 bg-amber-200/10 text-amber-100">
          <Share2 className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="gold-text text-sm font-semibold">分享这张命盘</p>
          <p className="mt-1 text-xs leading-5 text-white/45">生成只读分享页，不展示邮箱、昵称或出生时间。</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => void copyShareLink()}
          className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/72 transition hover:border-amber-200/30 hover:bg-amber-200/10 hover:text-amber-50"
        >
          <Copy className="h-3.5 w-3.5" />
          {copied ? "已复制" : "复制链接"}
        </button>
        <Link
          href={sharePath}
          className="flex items-center justify-center gap-2 rounded-2xl bg-[#6d4bd0] px-3 py-2 text-xs font-semibold text-white shadow-glow transition hover:bg-[#7b58df]"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          打开分享页
        </Link>
      </div>
    </div>
  );
}
