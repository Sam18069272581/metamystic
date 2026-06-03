"use client";

import { useState } from "react";
import { Stars } from "lucide-react";
import type { AstrologyChartDto, Gender } from "@metamystic/shared";
import { AstrologyChartBoard } from "@/components/astrology/astrology-chart-board";
import { MobileShell } from "@/components/shell/mobile-shell";
import { apiClient } from "@/lib/api-client";

export default function AstrologyPage() {
  const [birthTime, setBirthTime] = useState("1995-05-20T10:30");
  const [gender, setGender] = useState<Gender>("female");
  const [chart, setChart] = useState<AstrologyChartDto | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  async function submit(): Promise<void> {
    setLoading(true);
    setError(undefined);
    try {
      const profileInput = {
        displayName: "命主",
        birthTime: new Date(birthTime).toISOString(),
        birthTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        gender,
        birthPlace: "北京",
        latitude: 39.9042,
        longitude: 116.4074
      };
      const user = await apiClient.me().catch(() => undefined);
      const profile = user
        ? await apiClient.upsertMyProfile(profileInput)
        : await apiClient.upsertProfile({ anonymousUserId: "local-astrology-user", ...profileInput });
      const nextChart = user
        ? await apiClient.createMyAstrologyChart({ profileId: profile.id })
        : await apiClient.createAstrologyChart({ profileId: profile.id });
      setChart(nextChart);
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : "星盘生成失败，请稍后重试。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <MobileShell title={"星盘"}>
      <div className="space-y-4">
        <section className="mystic-card rounded-3xl p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-200/20 bg-amber-200/10 text-amber-200">
              <Stars className="h-4 w-4" />
            </div>
            <div>
              <p className="gold-text text-lg font-semibold">{"本命星盘"}</p>
              <p className="mt-1 text-xs text-white/42">{"生成太阳、月亮、上升与十二宫，作为 AI 长期画像的一部分"}</p>
            </div>
          </div>

          <label className="mt-4 block text-xs text-white/55">
            {"出生时间"}
            <input
              type="datetime-local"
              value={birthTime}
              onChange={(event) => setBirthTime(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none focus:border-[#d8a850]/50"
            />
          </label>
          <label className="mt-3 block text-xs text-white/55">
            {"性别"}
            <select
              value={gender}
              onChange={(event) => setGender(event.target.value as Gender)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none focus:border-[#d8a850]/50"
            >
              <option value="female">{"女"}</option>
              <option value="male">{"男"}</option>
              <option value="non_binary">{"非二元"}</option>
              <option value="unknown">{"不透露"}</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={loading}
            className="mt-4 w-full rounded-2xl bg-[#6d4bd0] px-4 py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-[#7b58df] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "生成中..." : "生成星盘"}
          </button>
          {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
        </section>

        {chart ? <AstrologyChartBoard chart={chart} /> : null}
      </div>
    </MobileShell>
  );
}
