"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";
import type { AuthUserDto, CreateUserProfileRequest, ProfileDto, UserChartArchiveDto, UserProfileListResponse } from "@metamystic/shared";
import { CalendarDays, CheckCircle2, CircleDotDashed, Plus, Sparkles, Stars, UserRound, UsersRound } from "lucide-react";
import { MobileShell } from "@/components/shell/mobile-shell";
import { apiClient } from "@/lib/api-client";

export default function MePage() {
  const [user, setUser] = useState<AuthUserDto | undefined>();
  const [archive, setArchive] = useState<UserChartArchiveDto | undefined>();
  const [profiles, setProfiles] = useState<UserProfileListResponse | undefined>();
  const [form, setForm] = useState<CreateUserProfileRequest>({
    label: "",
    displayName: "",
    birthTime: "",
    birthTimezone: "Asia/Shanghai",
    gender: "unknown"
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function loadAccount(): Promise<void> {
    const [nextUser, nextArchive, nextProfiles] = await Promise.all([
      apiClient.me(),
      apiClient.listMyCharts(),
      apiClient.listMyProfiles()
    ]);
    setUser(nextUser);
    setArchive(nextArchive);
    setProfiles(nextProfiles);
  }

  useEffect(() => {
    async function load(): Promise<void> {
      try {
        await loadAccount();
      } catch (unknownError) {
        setError(unknownError instanceof Error ? unknownError.message : "\u672a\u767b\u5f55");
      }
    }
    void load();
  }, []);

  async function handleCreateProfile(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSavingProfile(true);
    setError(undefined);
    try {
      await apiClient.createMyProfile({
        ...form,
        label: form.label?.trim() || form.displayName?.trim() || "\u65b0\u6863\u6848",
        displayName: form.displayName?.trim() || undefined,
        birthTime: new Date(form.birthTime).toISOString()
      });
      setForm({
        label: "",
        displayName: "",
        birthTime: "",
        birthTimezone: "Asia/Shanghai",
        gender: "unknown"
      });
      await loadAccount();
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : "\u65e0\u6cd5\u521b\u5efa\u6863\u6848");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleSetDefault(profileId: string): Promise<void> {
    setSavingProfile(true);
    setError(undefined);
    try {
      await apiClient.setDefaultMyProfile(profileId);
      await loadAccount();
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : "\u65e0\u6cd5\u5207\u6362\u9ed8\u8ba4\u6863\u6848");
    } finally {
      setSavingProfile(false);
    }
  }

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
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="gold-text text-lg font-semibold">{"\u547d\u7406\u6863\u6848"}</p>
              <p className="mt-1 text-xs text-white/42">{"\u4e3a\u81ea\u5df1\u3001\u4f34\u4fa3\u6216\u5bb6\u4eba\u4fdd\u5b58\u4e0d\u540c\u751f\u8fb0"}</p>
            </div>
            <UsersRound className="h-4 w-4 text-amber-100/70" />
          </div>
          <div className="mt-4 space-y-3">
            {profiles?.profiles.map((profile) => (
              <ProfileRow
                key={profile.id}
                disabled={savingProfile}
                isDefault={profile.id === profiles.defaultProfileId || profile.isDefault === true}
                profile={profile}
                onSetDefault={handleSetDefault}
              />
            ))}
            {profiles && profiles.profiles.length === 0 ? (
              <p className="rounded-2xl border border-white/8 bg-white/[0.035] p-3 text-sm text-white/55">
                {"\u6682\u65e0\u6863\u6848\uff0c\u5148\u65b0\u589e\u4e00\u4e2a\u51fa\u751f\u4fe1\u606f"}
              </p>
            ) : null}
          </div>
          <form className="mt-4 space-y-3 rounded-2xl border border-white/8 bg-white/[0.035] p-3" onSubmit={handleCreateProfile}>
            <div className="grid grid-cols-2 gap-2">
              <input
                className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-amber-200/40"
                placeholder={"\u6807\u7b7e\uff1a\u81ea\u5df1/\u4f34\u4fa3"}
                value={form.label ?? ""}
                onChange={(event) => setForm((current) => ({ ...current, label: event.target.value }))}
              />
              <input
                className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-amber-200/40"
                placeholder={"\u6635\u79f0"}
                value={form.displayName ?? ""}
                onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))}
              />
            </div>
            <input
              className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-amber-200/40"
              required
              type="datetime-local"
              value={form.birthTime}
              onChange={(event) => setForm((current) => ({ ...current, birthTime: event.target.value }))}
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-amber-200/40"
                value={form.gender}
                onChange={(event) => setForm((current) => ({ ...current, gender: event.target.value as CreateUserProfileRequest["gender"] }))}
              >
                <option value="unknown">{"\u672a\u8bbe\u7f6e"}</option>
                <option value="female">{"\u5973"}</option>
                <option value="male">{"\u7537"}</option>
                <option value="non_binary">{"\u975e\u4e8c\u5143"}</option>
              </select>
              <button
                className="flex items-center justify-center gap-2 rounded-xl border border-amber-200/20 bg-amber-200/10 px-3 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-200/15 disabled:opacity-50"
                disabled={savingProfile}
                type="submit"
              >
                <Plus className="h-4 w-4" />
                {"\u65b0\u589e\u6863\u6848"}
              </button>
            </div>
          </form>
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

function ProfileRow({
  disabled,
  isDefault,
  onSetDefault,
  profile
}: {
  disabled: boolean;
  isDefault: boolean;
  onSetDefault: (profileId: string) => Promise<void>;
  profile: ProfileDto;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.035] p-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-amber-100">
        {isDefault ? <CheckCircle2 className="h-4 w-4" /> : <UserRound className="h-4 w-4" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white/82">{profile.label ?? profile.displayName ?? "\u547d\u4e3b"}</p>
        <p className="mt-1 truncate text-xs text-white/42">
          {`${new Date(profile.birthTime).toLocaleString("zh-CN")} · ${profile.gender}`}
        </p>
      </div>
      <button
        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/55 transition hover:border-amber-200/30 hover:text-amber-100 disabled:opacity-50"
        disabled={disabled || isDefault}
        onClick={() => void onSetDefault(profile.id)}
        type="button"
      >
        {isDefault ? "\u9ed8\u8ba4" : "\u8bbe\u4e3a\u9ed8\u8ba4"}
      </button>
    </div>
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
