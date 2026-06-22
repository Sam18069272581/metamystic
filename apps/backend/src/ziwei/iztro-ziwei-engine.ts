import type { Gender, ZiweiPalaceDto, ZiweiPalaceName } from "@metamystic/shared";
import { astro } from "iztro";

export interface IztroZiweiInput {
  profileId: string;
  localDate: string;
  localTime: string;
  gender: Gender;
  lateZiHourRule: "nextDay" | "sameDay";
}

export interface IztroZiweiResult {
  profileId: string;
  lifePalace: ZiweiPalaceName;
  bodyPalace: ZiweiPalaceName;
  palaces: ZiweiPalaceDto[];
  summary: string;
  metadata: Record<string, unknown>;
}

const palaceNames: Record<string, ZiweiPalaceName> = {
  "命宫": "life", "兄弟": "siblings", "夫妻": "spouse", "子女": "children",
  "财帛": "wealth", "疾厄": "health", "迁移": "travel", "仆役": "friends", "交友": "friends",
  "官禄": "career", "事业": "career", "田宅": "property", "福德": "fortune", "父母": "parents"
};

export class IztroZiweiEngine {
  calculate(input: IztroZiweiInput): IztroZiweiResult {
    const hour = Number(input.localTime.slice(0, 2));
    const timeIndex = hour === 23 ? 12 : Math.floor((hour + 1) / 2);
    const gender = input.gender === "male" ? "男" : "女";
    const astrolabe = astro.bySolar(
      input.localDate,
      timeIndex,
      gender,
      true,
      "zh-CN"
    );
    const palaces: ZiweiPalaceDto[] = astrolabe.palaces.map((palace) => {
      const name = palaceNames[palace.name] ?? "life";
      return {
        name,
        label: palace.name.endsWith("宫") ? palace.name : `${palace.name}宫`,
        earthlyBranch: palace.earthlyBranch,
        majorStars: palace.majorStars.map(formatStar),
        minorStars: [...palace.minorStars, ...palace.adjectiveStars].map(formatStar),
        ageRange: `${palace.decadal.range[0]}-${palace.decadal.range[1]}`
      };
    });
    const bodyPalace = palaceNames[astrolabe.palaces.find((palace) => palace.isBodyPalace)?.name ?? "命"] ?? "life";
    return {
      profileId: input.profileId,
      lifePalace: "life",
      bodyPalace,
      palaces,
      summary: `命宫在${astrolabe.earthlyBranchOfSoulPalace}，命主${astrolabe.soul}，身主${astrolabe.body}，五行局为${astrolabe.fiveElementsClass}。`,
      metadata: {
        engine: "iztro",
        engineVersion: "2.5.8",
        license: "MIT",
        solarDate: astrolabe.solarDate,
        lunarDate: astrolabe.lunarDate,
        chineseDate: astrolabe.chineseDate,
        time: astrolabe.time,
        timeRange: astrolabe.timeRange,
        zodiac: astrolabe.zodiac,
        sign: astrolabe.sign,
        soul: astrolabe.soul,
        body: astrolabe.body,
        fiveElementsClass: astrolabe.fiveElementsClass,
        lateZiHourRule: input.lateZiHourRule,
        unsupportedGenderFallback: input.gender === "non_binary" || input.gender === "unknown"
      }
    };
  }
}

function formatStar(star: { name: string; brightness?: string | undefined; mutagen?: string | undefined }): string {
  const attributes = [star.brightness, star.mutagen ? `化${star.mutagen}` : undefined].filter(Boolean);
  return attributes.length ? `${star.name}（${attributes.join("·")}）` : star.name;
}
