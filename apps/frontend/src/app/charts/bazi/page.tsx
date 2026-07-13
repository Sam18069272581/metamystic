"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CalendarDays, CircleDotDashed, Stars } from "lucide-react";
import type { BaziChartDto, BirthInputV2, Gender } from "@metamystic/shared";
import { BaziChartCard } from "@/components/bazi/bazi-chart-card";
import { MobileShell } from "@/components/shell/mobile-shell";
import { apiClient } from "@/lib/api-client";
import { buildBirthInputV2 } from "@/lib/birth-input";
import { getDictionary, getLocaleFromPathname, withLocale } from "@/lib/i18n";

export default function BaziChartPage() {
  const locale = getLocaleFromPathname(usePathname());
  const dictionary = getDictionary(locale);
  const [year, setYear] = useState("1995");
  const [month, setMonth] = useState("05");
  const [day, setDay] = useState("20");
  const [hour, setHour] = useState("10");
  const [minute, setMinute] = useState("30");
  const [gender, setGender] = useState<Gender>("female");
  const [birthTimezone, setBirthTimezone] = useState("Asia/Shanghai");
  const [trueSolarTime, setTrueSolarTime] = useState(true);
  const [lateZiHourRule, setLateZiHourRule] = useState<"nextDay" | "sameDay">("nextDay");
  const [calendarType, setCalendarType] = useState<BirthInputV2["calendarType"]>("solar");
  const [timePrecision, setTimePrecision] = useState<BirthInputV2["timePrecision"]>("exact");
  const [dstDisambiguation, setDstDisambiguation] = useState<NonNullable<BirthInputV2["dstDisambiguation"]>>("reject");
  const [lunarLeapMonth, setLunarLeapMonth] = useState(false);
  const [birthPlace, setBirthPlace] = useState("北京");
  const [latitude, setLatitude] = useState("39.9042");
  const [longitude, setLongitude] = useState("116.4074");
  const [chart, setChart] = useState<BaziChartDto | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  async function submit(): Promise<void> {
    setLoading(true);
    setError(undefined);
    try {
      const profileInput = {
        displayName: "\u547d\u4e3b",
        birthTimezone,
        birthInput: buildBirthInputV2(`${year}-${month}-${day}T${timePrecision === "unknown" ? "12:00" : `${hour}:${minute}`}`, {
          timezone: birthTimezone,
          calendarType,
          timePrecision,
          trueSolarTime,
          lateZiHourRule,
          dstDisambiguation,
          lunarLeapMonth,
          location: { name: birthPlace, latitude: Number(latitude), longitude: Number(longitude) }
        }),
        gender,
        birthPlace,
        latitude: Number(latitude),
        longitude: Number(longitude)
      };
      const user = await apiClient.me().catch(() => undefined);
      const profile = user
        ? await apiClient.upsertMyProfile(profileInput)
        : await apiClient.upsertProfile({ anonymousUserId: "local-chart-user", ...profileInput });
      const nextChart = user
        ? await apiClient.createMyBaziChart({ profileId: profile.id })
        : await apiClient.createBaziChart({ profileId: profile.id });
      setChart(nextChart);
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : "\u6392\u76d8\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5\u3002");
    } finally {
      setLoading(false);
    }
  }

  return (
    <MobileShell locale={locale} title={dictionary.pages.bazi}>
      <div className="space-y-4">
        <section className="mystic-card rounded-3xl p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-200/20 bg-amber-200/10 text-amber-200">
              <CalendarDays className="h-4 w-4" />
            </div>
            <div>
              <p className="gold-text text-lg font-semibold">{"\u516b\u5b57\u4e13\u4e1a\u6392\u76d8"}</p>
              <p className="mt-1 text-xs text-white/42">{"\u6309\u5e74\u6708\u65e5\u65f6\u8f93\u5165\uff0c\u751f\u6210\u56db\u67f1\u3001\u85cf\u5e72\u3001\u5341\u795e\u3001\u795e\u715e\u548c\u559c\u7528\u795e"}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-5 gap-2">
            <DateInput label={"\u5e74"} value={year} onChange={setYear} />
            <DateInput label={"\u6708"} value={month} onChange={setMonth} />
            <DateInput label={"\u65e5"} value={day} onChange={setDay} />
            <DateInput label={"\u65f6"} value={hour} onChange={setHour} />
            <DateInput label={"\u5206"} value={minute} onChange={setMinute} />
          </div>
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
          <div className="mt-3 grid grid-cols-3 gap-2">
            <input value={birthPlace} onChange={(event) => setBirthPlace(event.target.value)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" placeholder="出生地" />
            <input value={latitude} onChange={(event) => setLatitude(event.target.value)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" placeholder="纬度" inputMode="decimal" />
            <input value={longitude} onChange={(event) => setLongitude(event.target.value)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" placeholder="经度" inputMode="decimal" />
          </div>
          <label className="mt-3 block text-xs text-white/55">
            {"出生时区"}
            <input
              value={birthTimezone}
              onChange={(event) => setBirthTimezone(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none focus:border-[#d8a850]/50"
              placeholder="Asia/Shanghai"
            />
          </label>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-white/65">
            <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <input type="checkbox" checked={trueSolarTime} onChange={(event) => setTrueSolarTime(event.target.checked)} />
              {"真太阳时"}
            </label>
            <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <input
                type="checkbox"
                checked={lateZiHourRule === "nextDay"}
                onChange={(event) => setLateZiHourRule(event.target.checked ? "nextDay" : "sameDay")}
              />
              {"晚子时换日"}
            </label>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="text-xs text-white/55">
              {"历法"}
              <select value={calendarType} onChange={(event) => setCalendarType(event.target.value as BirthInputV2["calendarType"])} className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white">
                <option value="solar">{"阳历"}</option>
                <option value="lunar">{"农历"}</option>
              </select>
            </label>
            <label className="text-xs text-white/55">
              {"时辰精度"}
              <select value={timePrecision} onChange={(event) => setTimePrecision(event.target.value as BirthInputV2["timePrecision"])} className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white">
                <option value="exact">{"精确时间"}</option>
                <option value="hour">{"只知道时辰"}</option>
                <option value="unknown">{"时辰未知"}</option>
              </select>
            </label>
          </div>
          <label className="mt-3 block text-xs text-white/55">
            {"夏令时重复时刻"}
            <select
              value={dstDisambiguation}
              onChange={(event) => setDstDisambiguation(event.target.value as NonNullable<BirthInputV2["dstDisambiguation"]>)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white"
            >
              <option value="reject">{"遇到歧义时停止并提示"}</option>
              <option value="earlier">{"采用较早时刻"}</option>
              <option value="later">{"采用较晚时刻"}</option>
            </select>
          </label>
          {calendarType === "lunar" ? (
            <label className="mt-3 flex items-center gap-2 text-xs text-white/65">
              <input type="checkbox" checked={lunarLeapMonth} onChange={(event) => setLunarLeapMonth(event.target.checked)} />
              {"闰月"}
            </label>
          ) : null}
          <button
            type="button"
            onClick={() => void submit()}
            disabled={loading}
            className="mt-4 w-full rounded-2xl bg-[#6d4bd0] px-4 py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-[#7b58df] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "\u6392\u76d8\u4e2d..." : "\u751f\u6210\u547d\u76d8"}
          </button>
          {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
        </section>

        {chart ? <BaziChartCard chart={chart} /> : null}

        <div className="grid grid-cols-2 gap-3">
          <FeatureTile href={withLocale("/charts/ziwei", locale)} icon={<CircleDotDashed className="h-4 w-4" />} title={"\u7d2b\u5fae\u6597\u6570"} />
          <FeatureTile href={withLocale("/charts/astrology", locale)} icon={<Stars className="h-4 w-4" />} title={"\u661f\u76d8"} />
        </div>
      </div>
    </MobileShell>
  );
}

function DateInput({ label, onChange, value }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="text-xs text-white/55">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value.padStart(label === "\u5e74" ? 4 : 2, "0"))}
        className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-2 py-3 text-center text-sm text-white outline-none focus:border-[#d8a850]/50"
      />
    </label>
  );
}

function FeatureTile({ href, icon, title }: { href: string; icon: React.ReactNode; title: string }) {
  return (
    <Link href={href} className="mystic-card rounded-2xl p-4 transition hover:border-amber-200/35">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-amber-100">
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-white/80">{title}</p>
          <p className="mt-1 text-xs text-white/38">{"实验功能 · 结果仅供预览"}</p>
        </div>
      </div>
    </Link>
  );
}
