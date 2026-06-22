import type { BirthInputV2 } from "@metamystic/shared";
import { LunarHour } from "tyme4ts";

export interface ResolvedBirthInput {
  birthTime: Date;
  localDate: string;
  localTime: string;
  trueSolarCorrectionMinutes: number;
}

export function resolveBirthInput(input: BirthInputV2): ResolvedBirthInput {
  if (input.calendarType === "fourPillars") {
    throw new RangeError("Four-pillar reverse lookup requires explicit pillar values");
  }
  const localTime = input.localTime ?? "12:00";
  const parsed = parseLocalDateTime(input.localDate, localTime);
  const solar = input.calendarType === "lunar" ? lunarToSolar(parsed, input.lunarLeapMonth === true) : parsed;
  const birthTime = zonedLocalToInstant(solar, input.timezone);
  const trueSolarCorrectionMinutes = input.trueSolarTime && input.location
    ? calculateTrueSolarCorrection(birthTime, input.timezone, input.location.longitude)
    : 0;
  return {
    birthTime,
    localDate: formatDate(solar),
    localTime: formatTime(solar),
    trueSolarCorrectionMinutes
  };
}

interface DateParts { year: number; month: number; day: number; hour: number; minute: number; second: number }

function parseLocalDateTime(date: string, time: string): DateParts {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const timeMatch = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(time);
  if (!dateMatch || !timeMatch) {
    throw new RangeError("Birth date and time must use YYYY-MM-DD and HH:mm formats");
  }
  return {
    year: Number(dateMatch[1]), month: Number(dateMatch[2]), day: Number(dateMatch[3]),
    hour: Number(timeMatch[1]), minute: Number(timeMatch[2]), second: Number(timeMatch[3] ?? 0)
  };
}

function lunarToSolar(parts: DateParts, leapMonth: boolean): DateParts {
  const solar = LunarHour.fromYmdHms(
    parts.year,
    leapMonth ? -parts.month : parts.month,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  ).getSolarTime();
  return {
    year: solar.getYear(), month: solar.getMonth(), day: solar.getDay(),
    hour: solar.getHour(), minute: solar.getMinute(), second: solar.getSecond()
  };
}

function zonedLocalToInstant(parts: DateParts, timeZone: string): Date {
  const desired = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  let candidate = desired;
  for (let iteration = 0; iteration < 4; iteration += 1) {
    const displayed = getZonedParts(new Date(candidate), timeZone);
    const rendered = Date.UTC(displayed.year, displayed.month - 1, displayed.day, displayed.hour, displayed.minute, displayed.second);
    const delta = desired - rendered;
    candidate += delta;
    if (delta === 0) break;
  }
  const result = new Date(candidate);
  const verified = getZonedParts(result, timeZone);
  if (Object.keys(parts).some((key) => parts[key as keyof DateParts] !== verified[key as keyof DateParts])) {
    throw new RangeError(`Local birth time does not exist in timezone ${timeZone}`);
  }
  return result;
}

export function getZonedParts(date: Date, timeZone: string): DateParts {
  const formatted = new Intl.DateTimeFormat("en-CA", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23"
  }).formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) => Number(formatted.find((part) => part.type === type)?.value);
  return { year: read("year"), month: read("month"), day: read("day"), hour: read("hour"), minute: read("minute"), second: read("second") };
}

function calculateTrueSolarCorrection(date: Date, timeZone: string, longitude: number): number {
  const year = getZonedParts(date, timeZone).year;
  const standardOffset = Math.min(offsetMinutes(new Date(Date.UTC(year, 0, 1, 12)), timeZone), offsetMinutes(new Date(Date.UTC(year, 6, 1, 12)), timeZone));
  const actualOffset = offsetMinutes(date, timeZone);
  const centralMeridian = (standardOffset / 60) * 15;
  const start = Date.UTC(year, 0, 1);
  const dayOfYear = Math.floor((Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - start) / 86_400_000) + 1;
  const b = (2 * Math.PI * (dayOfYear - 81)) / 364;
  const equationOfTime = 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
  return Number((4 * (longitude - centralMeridian) + equationOfTime - (actualOffset - standardOffset)).toFixed(2));
}

function offsetMinutes(date: Date, timeZone: string): number {
  const p = getZonedParts(date, timeZone);
  return (Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - date.getTime()) / 60_000;
}

function formatDate(p: DateParts): string { return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`; }
function formatTime(p: DateParts): string { return `${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`; }
