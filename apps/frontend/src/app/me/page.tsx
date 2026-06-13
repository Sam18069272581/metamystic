"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";
import type {
  AuthUserDto,
  CompatibilityReadingDto,
  CreateCompatibilityRequest,
  CreateUserProfileRequest,
  ProfileDto,
  UserChartArchiveDto,
  UserProfileListResponse
} from "@metamystic/shared";
import { ArrowRight, CalendarDays, CheckCircle2, CircleDotDashed, HeartHandshake, LogIn, LogOut, Mail, Plus, Sparkles, Stars, UserRound, UsersRound } from "lucide-react";
import { getAccountAuthActions, getAccountLogoutAction } from "./account-auth-actions";
import { getAccountAuthStatus, type AccountAuthStatus } from "./account-auth-status";
import { buildAccountNextStep, type AccountNextStep } from "./account-next-step";
import { ShareButton } from "@/components/share/share-button";
import { MobileShell } from "@/components/shell/mobile-shell";
import { apiClient } from "@/lib/api-client";
import { getApiBaseUrl } from "@/lib/public-url";

export default function MePage() {
  const authActions = getAccountAuthActions(getApiBaseUrl(process.env));
  const logoutAction = getAccountLogoutAction();
  const [authSource, setAuthSource] = useState<string | null>(null);
  const [accountLoading, setAccountLoading] = useState(true);
  const [user, setUser] = useState<AuthUserDto | undefined>();
  const authStatus = getAccountAuthStatus(authSource, Boolean(user));
  const [archive, setArchive] = useState<UserChartArchiveDto | undefined>();
  const [profiles, setProfiles] = useState<UserProfileListResponse | undefined>();
  const [form, setForm] = useState<CreateUserProfileRequest>({
    label: "",
    displayName: "",
    birthTime: "",
    birthTimezone: "Asia/Shanghai",
    gender: "unknown"
  });
  const [compatibilityInput, setCompatibilityInput] = useState<CreateCompatibilityRequest>({
    profileAId: "",
    profileBId: ""
  });
  const [compatibility, setCompatibility] = useState<CompatibilityReadingDto | undefined>();
  const [compatibilityHistory, setCompatibilityHistory] = useState<CompatibilityReadingDto[]>([]);
  const [savingProfile, setSavingProfile] = useState(false);
  const [creatingBazi, setCreatingBazi] = useState(false);
  const [readingCompatibility, setReadingCompatibility] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function loadAccount(): Promise<void> {
    setAccountLoading(true);
    const [nextUser, nextArchive, nextProfiles, nextCompatibilityHistory] = await Promise.all([
      apiClient.me(),
      apiClient.listMyCharts(),
      apiClient.listMyProfiles(),
      apiClient.listMyCompatibilityReadings()
    ]);
    setUser(nextUser);
    setArchive(nextArchive);
    setProfiles(nextProfiles);
    setError(undefined);
    setCompatibilityHistory(nextCompatibilityHistory.readings);
    setCompatibilityInput((current) => {
      if (current.profileAId && current.profileBId) {
        return current;
      }
      return {
        profileAId: nextProfiles.profiles[0]?.id ?? "",
        profileBId: nextProfiles.profiles[1]?.id ?? ""
      };
    });
  }

  useEffect(() => {
    setAuthSource(new URLSearchParams(window.location.search).get("auth"));
    async function load(): Promise<void> {
      try {
        await loadAccount();
      } catch (unknownError) {
        setUser(undefined);
        setArchive(undefined);
        setProfiles(undefined);
        setCompatibilityHistory([]);
        setError(unknownError instanceof Error ? unknownError.message : "\u672a\u767b\u5f55");
      } finally {
        setAccountLoading(false);
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

  async function handleCreateBaziFromProfile(profileId: string): Promise<void> {
    setCreatingBazi(true);
    setError(undefined);
    try {
      await apiClient.createMyBaziChart({ profileId });
      await loadAccount();
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : "\u65e0\u6cd5\u751f\u6210\u516b\u5b57\u547d\u76d8");
    } finally {
      setCreatingBazi(false);
      setAccountLoading(false);
    }
  }

  async function handleCreateCompatibility(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!compatibilityInput.profileAId || !compatibilityInput.profileBId || compatibilityInput.profileAId === compatibilityInput.profileBId) {
      setError("\u8bf7\u9009\u62e9\u4e24\u4e2a\u4e0d\u540c\u7684\u547d\u7406\u6863\u6848");
      return;
    }
    setReadingCompatibility(true);
    setError(undefined);
    try {
      const reading = await apiClient.createMyCompatibilityReading(compatibilityInput);
      setCompatibility(reading);
      setCompatibilityHistory((current) => [reading, ...current.filter((item) => item.id !== reading.id)].slice(0, 20));
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : "\u65e0\u6cd5\u751f\u6210\u5408\u76d8\u5206\u6790");
    } finally {
      setReadingCompatibility(false);
    }
  }

  async function handleLogout(): Promise<void> {
    setAccountLoading(true);
    setError(undefined);
    try {
      await apiClient.logout();
      setUser(undefined);
      setArchive(undefined);
      setProfiles(undefined);
      setCompatibility(undefined);
      setCompatibilityHistory([]);
      setAuthSource(null);
      window.history.replaceState(null, "", "/me");
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : "退出登录失败，请稍后重试。");
    } finally {
      setAccountLoading(false);
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
          {authStatus && !accountLoading ? <AuthStatusBanner status={authStatus} /> : null}
          {error && !accountLoading ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
          {!user && !accountLoading ? (
            <div className="mt-4 grid grid-cols-2 gap-2">
              {authActions.map((action) => {
                const Icon = action.variant === "primary" ? LogIn : Mail;
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className={
                      action.variant === "primary"
                        ? "flex items-center justify-center gap-2 rounded-2xl bg-[#6d4bd0] px-4 py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-[#7b58df]"
                        : "flex items-center justify-center gap-2 rounded-2xl border border-amber-200/20 bg-amber-200/10 px-4 py-3 text-sm font-semibold text-amber-100 transition hover:bg-amber-200/15"
                    }
                  >
                    <Icon className="h-4 w-4" />
                    {action.label}
                  </Link>
                );
              })}
            </div>
          ) : null}
          {user && !accountLoading ? (
            <button
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white/68 transition hover:border-amber-200/30 hover:text-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={accountLoading}
              onClick={() => void handleLogout()}
              type="button"
            >
              <LogOut className="h-4 w-4" />
              {logoutAction.label}
            </button>
          ) : null}
        </section>

        <AccountNextStepCard
          busy={creatingBazi}
          step={buildAccountNextStep({ archive, loading: accountLoading, profiles, user })}
          onCreateBazi={handleCreateBaziFromProfile}
        />

        {user ? (
          <>

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
          <form id="profile-form" className="mt-4 space-y-3 rounded-2xl border border-white/8 bg-white/[0.035] p-3" onSubmit={handleCreateProfile}>
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
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="gold-text text-lg font-semibold">{"\u516b\u5b57\u5408\u76d8"}</p>
              <p className="mt-1 text-xs text-white/42">{"\u9009\u62e9\u4e24\u4e2a\u6863\u6848\uff0c\u89c2\u5bdf\u4e94\u884c\u4e92\u8865\u4e0e\u5408\u51b2\u98ce\u9669"}</p>
            </div>
            <HeartHandshake className="h-4 w-4 text-amber-100/70" />
          </div>
          <form className="mt-4 space-y-3" onSubmit={handleCreateCompatibility}>
            <div className="grid grid-cols-2 gap-2">
              <ProfileSelect
                profiles={profiles?.profiles ?? []}
                value={compatibilityInput.profileAId}
                onChange={(profileAId) => setCompatibilityInput((current) => ({ ...current, profileAId }))}
              />
              <ProfileSelect
                profiles={profiles?.profiles ?? []}
                value={compatibilityInput.profileBId}
                onChange={(profileBId) => setCompatibilityInput((current) => ({ ...current, profileBId }))}
              />
            </div>
            <button
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-amber-200/20 bg-amber-200/10 px-3 py-3 text-sm font-semibold text-amber-100 transition hover:bg-amber-200/15 disabled:opacity-50"
              disabled={readingCompatibility || (profiles?.profiles.length ?? 0) < 2}
              type="submit"
            >
              <HeartHandshake className="h-4 w-4" />
              {readingCompatibility ? "\u5408\u76d8\u5206\u6790\u4e2d" : "\u5f00\u59cb\u5408\u76d8"}
            </button>
          </form>
          {profiles && profiles.profiles.length < 2 ? (
            <p className="mt-3 rounded-2xl border border-white/8 bg-white/[0.035] p-3 text-sm text-white/55">
              {"\u81f3\u5c11\u9700\u8981\u4e24\u4e2a\u547d\u7406\u6863\u6848\u624d\u80fd\u751f\u6210\u5408\u76d8"}
            </p>
          ) : null}
          {compatibility ? <CompatibilityCard reading={compatibility} /> : null}
          {compatibilityHistory.length > 0 ? (
            <div className="mt-4 space-y-2">
              <p className="text-xs text-white/40">{"最近合盘"}</p>
              {compatibilityHistory.slice(0, 3).map((reading) => (
                <div
                  key={reading.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.035] p-3 transition hover:border-amber-200/30"
                >
                  <Link href={`/share/compatibility/${reading.id}`} className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white/82">
                      {`${reading.profiles.a.label} × ${reading.profiles.b.label}`}
                    </p>
                    <p className="mt-1 text-xs text-white/42">{new Date(reading.createdAt).toLocaleString("zh-CN")}</p>
                  </Link>
                  <span className="shrink-0 rounded-full border border-amber-200/20 bg-amber-200/10 px-3 py-1 text-xs text-amber-100">
                    {reading.overallScore}
                  </span>
                  <ShareButton
                    path={`/share/compatibility/${reading.id}`}
                    text={`缘分分 ${reading.overallScore} · ${levelText(reading.level)}`}
                    title={`${reading.profiles.a.label} × ${reading.profiles.b.label} 的八字合盘`}
                  />
                </div>
              ))}
            </div>
          ) : null}
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
          </>
        ) : null}
      </div>
    </MobileShell>
  );
}

function AuthStatusBanner({ status }: { status: AccountAuthStatus }) {
  const isWarning = status.tone === "warning";
  return (
    <div
      className={
        isWarning
          ? "mt-4 rounded-2xl border border-amber-200/20 bg-amber-200/[0.08] p-3"
          : "mt-4 rounded-2xl border border-emerald-200/20 bg-emerald-200/[0.08] p-3"
      }
    >
      <div className="flex items-start gap-3">
        <CheckCircle2 className={isWarning ? "mt-0.5 h-4 w-4 shrink-0 text-amber-200" : "mt-0.5 h-4 w-4 shrink-0 text-emerald-200"} />
        <div>
          <p className={isWarning ? "text-sm font-semibold text-amber-100" : "text-sm font-semibold text-emerald-100"}>{status.title}</p>
          <p className="mt-1 text-xs leading-5 text-white/58">{status.description}</p>
        </div>
      </div>
    </div>
  );
}

function AccountNextStepCard({
  busy,
  onCreateBazi,
  step
}: {
  busy: boolean;
  onCreateBazi: (profileId: string) => Promise<void>;
  step: AccountNextStep;
}) {
  const canCreateBazi = step.primaryAction === "create_bazi" && Boolean(step.profileId);
  return (
    <section className="mystic-card rounded-3xl border-amber-200/15 bg-amber-200/[0.035] p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="rounded-full border border-amber-200/20 bg-amber-200/10 px-3 py-1 text-[11px] font-medium text-amber-100">
            {step.statusLabel}
          </span>
          <h2 className="gold-text mt-3 text-lg font-semibold">{step.title}</h2>
          <p className="mt-2 text-sm leading-6 text-white/60">{step.description}</p>
        </div>
        <Sparkles className="mt-1 h-5 w-5 shrink-0 text-amber-100/70" />
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {canCreateBazi ? (
          <button
            className="flex items-center justify-center gap-2 rounded-2xl bg-[#6d4bd0] px-4 py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-[#7b58df] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={busy}
            onClick={() => void onCreateBazi(step.profileId as string)}
            type="button"
          >
            {busy ? "\u751f\u6210\u4e2d..." : step.primaryLabel}
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : step.primaryHref ? (
          <Link
            href={step.primaryHref}
            className="flex items-center justify-center gap-2 rounded-2xl bg-[#6d4bd0] px-4 py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-[#7b58df]"
          >
            {step.primaryLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center text-sm font-semibold text-white/55">
            {step.primaryLabel}
          </div>
        )}
        {step.secondaryHref && step.secondaryLabel ? (
          <Link
            href={step.secondaryHref}
            className="flex items-center justify-center gap-2 rounded-2xl border border-amber-200/20 bg-amber-200/10 px-4 py-3 text-sm font-semibold text-amber-100 transition hover:bg-amber-200/15"
          >
            {step.secondaryLabel}
          </Link>
        ) : null}
      </div>
    </section>
  );
}

function ProfileSelect({
  onChange,
  profiles,
  value
}: {
  onChange: (profileId: string) => void;
  profiles: ProfileDto[];
  value: string;
}) {
  return (
    <select
      className="min-w-0 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-amber-200/40"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">{"\u9009\u62e9\u6863\u6848"}</option>
      {profiles.map((profile) => (
        <option key={profile.id} value={profile.id}>
          {profile.label ?? profile.displayName ?? "\u547d\u4e3b"}
        </option>
      ))}
    </select>
  );
}

function CompatibilityCard({ reading }: { reading: CompatibilityReadingDto }) {
  return (
    <div className="mt-4 space-y-3 rounded-2xl border border-amber-200/15 bg-amber-200/[0.045] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white/86">{`${reading.profiles.a.label} × ${reading.profiles.b.label}`}</p>
          <p className="mt-1 text-xs text-white/45">{levelText(reading.level)}</p>
        </div>
        <div className="text-right">
          <p className="gold-text text-3xl font-semibold">{reading.overallScore}</p>
          <p className="text-xs text-white/40">{"\u7f18\u5206\u5206"}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <DimensionMini label={"\u4e94\u884c"} dimension={reading.dimensions.fiveElement} />
        <DimensionMini label={"\u5929\u5e72"} dimension={reading.dimensions.stems} />
        <DimensionMini label={"\u5730\u652f"} dimension={reading.dimensions.branches} />
        <DimensionMini label={"\u65e5\u4e3b"} dimension={reading.dimensions.dayMasters} />
      </div>
      <TextList title={"\u76f8\u5904\u4f18\u52bf"} items={reading.advantages} />
      <TextList title={"\u98ce\u9669\u63d0\u9192"} items={reading.risks} />
      <TextList title={"\u5efa\u8bae"} items={reading.advice} />
      <p className="text-[11px] leading-relaxed text-white/35">{reading.disclaimer}</p>
    </div>
  );
}

function DimensionMini({ dimension, label }: { dimension: CompatibilityReadingDto["dimensions"]["fiveElement"]; label: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-black/15 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-white/45">{label}</p>
        <p className="text-sm font-semibold text-amber-100">{dimension.score}</p>
      </div>
      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-white/68">{dimension.summary}</p>
    </div>
  );
}

function TextList({ items, title }: { items: string[]; title: string }) {
  return (
    <div>
      <p className="text-xs text-white/40">{title}</p>
      <div className="mt-2 space-y-1">
        {items.map((item) => (
          <p key={item} className="rounded-xl border border-white/8 bg-black/15 px-3 py-2 text-xs leading-relaxed text-white/68">
            {item}
          </p>
        ))}
      </div>
    </div>
  );
}

function levelText(level: CompatibilityReadingDto["level"]): string {
  const labels: Record<CompatibilityReadingDto["level"], string> = {
    excellent: "\u9ad8\u5951\u5408",
    good: "\u4e92\u8865\u826f\u597d",
    balanced: "\u5e73\u8861\u53ef\u7ecf\u8425",
    challenging: "\u9700\u8981\u66f4\u591a\u78e8\u5408"
  };
  return labels[level];
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

