"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { AuthUserDto, UserChartArchiveDto } from "@metamystic/shared";
import { CalendarDays, CircleDotDashed, Sparkles, Stars, UserRound } from "lucide-react";
import { MobileShell } from "@/components/shell/mobile-shell";
import { apiClient } from "@/lib/api-client";

export default function MePage() {
  const [user, setUser] = useState<AuthUserDto | undefined>();
  const [archive, setArchive] = useState<UserChartArchiveDto | undefined>();
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    async function load(): Promise<void> {
      try {
        const nextUser = await apiClient.me();
        setUser(nextUser);
        setArchive(await apiClient.listMyCharts());
      } catch (unknownError) {
        setError(unknownError instanceof Error ? unknownError.message : "\u672a\u767b\u5f55");
      }
    }
    void load();
  }, []);

  return (
    <MobileShell title={"\u4e2a\u4eba\u8d44\u6599"}>
      <div className="space-y-4">
        <section className="mystic-card rounded-3xl p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-200/20 bg-amber-200/10 text-amber-200">
              <UserRound className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="gold-text text-lg font-semibold">{user?.displayName ?? user?.email ?? "\u672a\u767b\u5f55"}</p>
              <p className="mt-1 truncate text-xs text-white/45">
                {user ? `${user.role} · ${user.email ?? ""}` : "\u8bf7\u5148\u767b\u5f55\u540e\u67e5\u770b\u8d26\u53f7\u8d44\u6599"}
              </p>
            </div>
          </div>
          {archive?.profile ? (
            <div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.035] p-3">
              <p className="text-xs text-white/40">{"\u51fa\u751f\u6863\u6848"}</p>
              <p className="mt-1 text-sm font-semibold text-white/82">{archive.profile.displayName ?? "\u547d\u4e3b"}</p>
              <p className="mt-1 text-xs text-white/45">
                {`${new Date(archive.profile.birthTime).toLocaleString("zh-CN")} · ${archive.profile.gender}`}
              </p>
            </div>
          ) : null}
          {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
        </section>

        <section className="mystic-card rounded-3xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="gold-text text-lg font-semibold">{"\u6211\u7684\u547d\u76d8"}</p>
              <p className="mt-1 text-xs text-white/42">{"\u6700\u8fd1\u751f\u6210\u7684\u516b\u5b57\u3001\u7d2b\u5fae\u4e0e\u661f\u76d8"}</p>
            </div>
            <Sparkles className="h-4 w-4 text-amber-100/70" />
          </div>
          <div className="mt-4 space-y-3">
            <ChartRow
              href={archive?.baziCharts[0] ? `/me/charts/bazi/${archive.baziCharts[0].id}` : "/charts/bazi"}
              icon={<CalendarDays className="h-4 w-4" />}
              label={"\u516b\u5b57"}
              count={archive?.baziCharts.length ?? 0}
              detail={archive?.baziCharts[0]?.mainPattern}
            />
            <ChartRow
              href={archive?.ziweiCharts[0] ? `/me/charts/ziwei/${archive.ziweiCharts[0].id}` : "/charts/ziwei"}
              icon={<CircleDotDashed className="h-4 w-4" />}
              label={"\u7d2b\u5fae"}
              count={archive?.ziweiCharts.length ?? 0}
              detail={archive?.ziweiCharts[0] ? `\u547d\u5bab ${archive.ziweiCharts[0].lifePalace}` : undefined}
            />
            <ChartRow
              href={archive?.astrologyCharts[0] ? `/me/charts/astrology/${archive.astrologyCharts[0].id}` : "/charts/astrology"}
              icon={<Stars className="h-4 w-4" />}
              label={"\u661f\u76d8"}
              count={archive?.astrologyCharts.length ?? 0}
              detail={archive?.astrologyCharts[0]?.placements.map((placement) => `${placement.label}${placement.sign}`).join(" · ")}
            />
          </div>
        </section>
      </div>
    </MobileShell>
  );
}

function ChartRow({
  count,
  detail,
  href,
  icon,
  label
}: {
  count: number;
  detail: string | undefined;
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.035] p-3 transition hover:border-amber-200/30"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-amber-100">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white/82">{label}</p>
        <p className="mt-1 truncate text-xs text-white/42">{detail ?? "\u6682\u65e0\u8bb0\u5f55\uff0c\u70b9\u51fb\u751f\u6210"}</p>
      </div>
      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/55">{count}</span>
    </Link>
  );
}
