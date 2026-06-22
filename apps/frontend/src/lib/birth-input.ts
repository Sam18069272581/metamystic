import type { BirthInputV2 } from "@metamystic/shared";

interface BirthInputOptions {
  timezone: string;
  calendarType?: BirthInputV2["calendarType"];
  timePrecision?: BirthInputV2["timePrecision"];
  trueSolarTime?: boolean;
  lateZiHourRule?: BirthInputV2["lateZiHourRule"];
  location?: BirthInputV2["location"];
  lunarLeapMonth?: boolean;
}

export function buildBirthInputV2(localDateTime: string, options: BirthInputOptions): BirthInputV2 {
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})$/.exec(localDateTime);
  if (!match) {
    throw new Error("请输入完整的出生日期和时间。");
  }
  return {
    calendarType: options.calendarType ?? "solar",
    localDate: match[1]!,
    localTime: match[2]!,
    timezone: options.timezone,
    location: options.location,
    timePrecision: options.timePrecision ?? "exact",
    trueSolarTime: options.trueSolarTime ?? false,
    lateZiHourRule: options.lateZiHourRule ?? "sameDay",
    ...(options.lunarLeapMonth !== undefined ? { lunarLeapMonth: options.lunarLeapMonth } : {})
  };
}
