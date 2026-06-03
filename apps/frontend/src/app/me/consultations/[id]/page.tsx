"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Bot, UserRound } from "lucide-react";
import type { ConsultationHistoryDto } from "@metamystic/shared";
import { MobileShell } from "@/components/shell/mobile-shell";
import { apiClient } from "@/lib/api-client";

export default function MyConsultationDetailPage() {
  const params = useParams<{ id: string }>();
  const [history, setHistory] = useState<ConsultationHistoryDto | undefined>();
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    void apiClient
      .getMyConsultationHistory(params.id)
      .then(setHistory)
      .catch((unknownError: unknown) => setError(unknownError instanceof Error ? unknownError.message : "\u54a8\u8be2\u8bb0\u5f55\u8bfb\u53d6\u5931\u8d25"));
  }, [params.id]);

  return (
    <MobileShell title={"\u54a8\u8be2\u8be6\u60c5"}>
      <div className="space-y-4">
        <section className="mystic-card rounded-3xl p-4">
          <p className="gold-text text-lg font-semibold">{history?.consultation.question ?? "\u54a8\u8be2\u8bb0\u5f55"}</p>
          {history ? (
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/45">
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">{statusLabel(history.consultation.status)}</span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">{toneLabel(history.consultation.tone)}</span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
                {new Date(history.consultation.createdAt).toLocaleString("zh-CN")}
              </span>
            </div>
          ) : null}
          {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
        </section>

        <section className="space-y-3">
          {history?.messages.map((message) => (
            <div
              key={message.id}
              className={`rounded-3xl border p-4 ${
                message.role === "assistant"
                  ? "border-amber-200/15 bg-amber-200/[0.055]"
                  : "border-violet-200/15 bg-violet-200/[0.055]"
              }`}
            >
              <div className="mb-2 flex items-center gap-2 text-xs text-white/45">
                {message.role === "assistant" ? <Bot className="h-4 w-4 text-amber-100" /> : <UserRound className="h-4 w-4 text-violet-100" />}
                <span>{message.role === "assistant" ? "AI \u89e3\u8bfb" : "\u4f60"}</span>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-6 text-white/76">{message.content}</p>
            </div>
          ))}
        </section>
      </div>
    </MobileShell>
  );
}

function statusLabel(status: ConsultationHistoryDto["consultation"]["status"]): string {
  return {
    pending: "\u7b49\u5f85\u4e2d",
    streaming: "\u63a8\u6f14\u4e2d",
    completed: "\u5df2\u5b8c\u6210",
    failed: "\u672a\u5b8c\u6210"
  }[status];
}

function toneLabel(tone: ConsultationHistoryDto["consultation"]["tone"]): string {
  return {
    strategic: "\u7406\u6027\u7b56\u7565",
    gentle: "\u6e29\u67d4\u966a\u4f34"
  }[tone];
}
