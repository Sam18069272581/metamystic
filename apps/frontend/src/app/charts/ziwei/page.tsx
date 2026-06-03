"use client";

import { useState } from "react";
import type { Gender, ZiweiChartDto } from "@metamystic/shared";
import { MobileShell } from "@/components/shell/mobile-shell";
import { ZiweiChartBoard } from "@/components/ziwei/ziwei-chart-board";
import { apiClient } from "@/lib/api-client";

export default function ZiweiPage() {
  const [birthTime, setBirthTime] = useState("1995-05-20T10:30");
  const [gender, setGender] = useState<Gender>("female");
  const [chart, setChart] = useState<ZiweiChartDto | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  async function submit(): Promise<void> {
    setLoading(true);
    setError(undefined);
    try {
      const profileInput = {
        displayName: "\u547d\u4e3b",
        birthTime: new Date(birthTime).toISOString(),
        birthTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        gender,
        birthPlace: "\u5317\u4eac",
        latitude: 39.9042,
        longitude: 116.4074
      };
      const user = await apiClient.me().catch(() => undefined);
      const profile = user
        ? await apiClient.upsertMyProfile(profileInput)
        : await apiClient.upsertProfile({ anonymousUserId: "local-ziwei-user", ...profileInput });
      const nextChart = user
        ? await apiClient.createMyZiweiChart({ profileId: profile.id })
        : await apiClient.createZiweiChart({ profileId: profile.id });
      setChart(nextChart);
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : "\u7d2b\u5fae\u6392\u76d8\u5931\u8d25\u3002");
    } finally {
      setLoading(false);
    }
  }

  return (
    <MobileShell title={"\u7d2b\u5fae\u6597\u6570"}>
      <div className="space-y-4">
        <section className="mystic-card rounded-3xl p-4">
          <p className="gold-text text-lg font-semibold">{"\u7d2b\u5fae\u5341\u4e8c\u5bab"}</p>
          <p className="mt-1 text-xs leading-5 text-white/42">{"MVP \u5148\u5efa\u7acb\u76d8\u9762\u4e0e AI \u4e0a\u4e0b\u6587\uff0c\u540e\u7eed\u63a5\u5165\u6b63\u5f0f\u7d2b\u5fae\u7b97\u6cd5\u3002"}</p>
          <label className="mt-4 block text-xs text-white/55">
            {"\u51fa\u751f\u65f6\u95f4"}
            <input
              type="datetime-local"
              value={birthTime}
              onChange={(event) => setBirthTime(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none focus:border-[#d8a850]/50"
            />
          </label>
          <label className="mt-3 block text-xs text-white/55">
            {"\u6027\u522b"}
            <select
              value={gender}
              onChange={(event) => setGender(event.target.value as Gender)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none focus:border-[#d8a850]/50"
            >
              <option value="female">{"\u5973"}</option>
              <option value="male">{"\u7537"}</option>
              <option value="non_binary">{"\u975e\u4e8c\u5143"}</option>
              <option value="unknown">{"\u4e0d\u900f\u9732"}</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={loading}
            className="mt-4 w-full rounded-2xl bg-[#6d4bd0] px-4 py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-[#7b58df] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "\u6392\u76d8\u4e2d..." : "\u751f\u6210\u7d2b\u5fae\u76d8"}
          </button>
          {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
        </section>
        {chart ? <ZiweiChartBoard chart={chart} /> : null}
      </div>
    </MobileShell>
  );
}
